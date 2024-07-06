const couponModel = require("../Discount/model");
const productModel = require("../Products/model");
const Category = require("../Category/model");
const User = require("../User/model");
const {
    BadRequest,
    Unauthorized,
    Forbidden,
    NoContent,
}=require('../../utility/errors');
const { errorMonitor } = require("nodemailer/lib/xoauth2");
const OrderModel = require("../Order/model");


const generateCouponService = async (couponInfo) => {
  try {
    if (!couponInfo) {
      throw new Error('Coupon information is required');
    }

    const { categoryId, general, usageRestriction, usageLimit } = couponInfo;

    if (!general) {
      throw new Error('General coupon information is required');
    }

    const { couponName, discountType, couponAmount, allowFreeShipping, couponExpiry } = general;

    if (!couponName) {
      throw new Error('Coupon name is required');
    }
    if (!discountType) {
      throw new Error('Discount type is required');
    }
    if (discountType === 'fixed' && (couponAmount == null || couponAmount === undefined)) {
      throw new Error('Coupon amount is required for fixed discount type');
    }
    if(discountType==='percentage' && (couponAmount == null || couponAmount === undefined||couponAmount<0 || couponAmount>100)){
        throw new Error('Coupon amount is required for percentage discount type and should be between 0 to 100');
    }
    if (!couponExpiry) {
      throw new Error('Coupon expiry date is required');
    }

    const newCoupon = await couponModel.create({
      categoryId,
      general: {
        couponName,
        discountType,
        couponAmount,
        allowFreeShipping,
        couponExpiry
      },
      usageRestriction,
      usageLimit
    });

    return { couponInfo: newCoupon };
  } catch (error) {
    console.error('Error in generateCouponService:', error.message);
    throw new Error('Failed to generate coupon: ' + error.message);
  }
};


const updateCouponServicebyId = async (id, updatedInfo) => {
    try {
        if (!id) {
            throw new Error('Coupon ID is required');
        }
        if (!updatedInfo || Object.keys(updatedInfo).length === 0) {
            throw new Error('Update information is required');
        }

        const couponUpdates = await couponModel.findByIdAndUpdate(id, updatedInfo, { new: true });

        if (!couponUpdates) {
            throw new Error('Coupon not found');
        }

        return { success: true, data: couponUpdates };
    } catch (error) {
        console.error('Error in updateCouponServicebyId:', error.message);
        return { success: false, error: error.message };
    }
};

const getAllCouponService = async () => {
    try {
        const allCoupons = await couponModel.find();
        return { success: true, data: allCoupons };
    } catch (error) {
        console.error('Error in getAllCouponService:', error.message);
        return { success: false, error: 'Failed to retrieve coupons' };
    }
};

const getAllCoupoByCategoryService = async(categoryId)=>{
    try{
        const allCoupons = await couponModel.find({ categoryId:categoryId });
        return {success:true,data : allCoupons};
    }
    catch(error){
        console.error('Error in getAllCoupoByCategoryService:', error.message);
        return { success: false, error: 'Failed to retrieve coupons' };
    }
}

const deleteCouponByIdService = async (couponId) => {
    try {
        const data = await couponModel.findByIdAndDelete(couponId);
        return {success:true,data : data};
    } catch (error) {
        console.error('Error in deleteCouponByIdService:', error.message);
        return { success: false, error: 'Failed to delete coupons' };
    }
}
const getCouponByCodeService = async (couponCode) => {
    try {
        const couponInfo = await couponModel.findOne({ couponName: couponCode });
        return {success:true, data :couponInfo };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to retreive coupons by coupon name' };
    }
}
const getDiscountByCoupon = async (couponId, products, userId) => {
  const coupon = await couponModel.findById(couponId);
  if (!coupon) {
    throw new BadRequest("Coupon code is not available");
  }

  const currentDate = new Date();
  if (currentDate > coupon.general.couponExpiry) {
    throw new BadRequest("Coupon code expired");
  }

  // Fetch product details to calculate total price
  const productIds = products.map(product => product._id);
  const requestedProductData = await productModel.find({ _id: { $in: productIds } });

  if (requestedProductData.length !== products.length) {
    throw new BadRequest("Some products are not valid");
  }

  // Calculate total price from the included products
  let totalPrice = 0;
  requestedProductData.forEach(product => {
    const productInOrder = products.find(p => p._id.toString() === product._id.toString());
    const productPrice = product.general.regularPrice;
    totalPrice += productPrice * productInOrder.quantity;
  });

  if (totalPrice < coupon.usageRestriction.minimumSpend) {
    throw new BadRequest("You need to spend more to access the coupon");
  }

  if (totalPrice > coupon.usageRestriction.maximumSpend) {
    throw new BadRequest("You need to spend less to access the coupon");
  }

  // Check if the coupon is blocked for all users
  if (coupon.usageLimit.usageLimitPerCoupon <= 0) {
    throw new BadRequest("Coupon is no longer available");
  }

  // Check if the user has reached the usage limit for this coupon
  if (coupon.usageLimit.usageLimitPerUser <= 0) {
    throw new BadRequest("You have reached the maximum usage limit for this coupon");
  }

  // Check if the user account is blocked
  if (coupon.usageRestriction.blockedAccounts.includes(userId)) {
    throw new BadRequest("Your account is blocked and cannot use this coupon");
  }

  // Check if requested products are included/excluded based on coupon restrictions
  requestedProductData.forEach(product => {
    if (!coupon.usageRestriction.products.includes(product._id.toString())) {
      throw new BadRequest(`Product ${product.productName} is not eligible for this coupon`);
    }
    if (coupon.usageRestriction.excludeProducts.includes(product._id.toString())) {
      throw new BadRequest(`Product ${product.productName} is excluded from this coupon`);
    }
  });

  // Fetch categories of the requested products
  const categoryIds = [...new Set(requestedProductData.flatMap(product => product.categoryId))];
  const categoryData = await Category.find({ _id: { $in: categoryIds } });

  categoryData.forEach(category => {
    if (!coupon.usageRestriction.categories.includes(category._id.toString())) {
      throw new BadRequest(`Category ${category.categoryName} is not eligible for this coupon`);
    }
    if (coupon.usageRestriction.excludeCategories.includes(category._id.toString())) {
      throw new BadRequest(`Category ${category.categoryName} is excluded from this coupon`);
    }
  });

  let discount = 0;
  if (coupon.general.discountType === 'percentage') {
    discount = (coupon.general.couponAmount / 100) * totalPrice;
  } else {
    discount = coupon.general.couponAmount;
  }

  coupon.usageLimit.usageLimitPerCoupon -= 1;
  coupon.usageLimit.usageLimitPerUser -= 1;

  await coupon.save();

  const discountedPrice = totalPrice - discount;
  const vat = (15 / 100) * discountedPrice;
  const finalPrice = discountedPrice + vat;

  return {
    discount,
    totalPrice,
    discountedPrice,
    vat,
    finalPrice
  };
};

const getCouponByTypeService = async (discountType) => {
    try {
        let coupons;
        if (discountType === "fixed" || discountType === "percentage") {
            coupons = await couponModel.find({ "general.discountType": discountType });
        } else {
            coupons = [];
        }
        return coupons;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getDiscountById = async(id)=>{
    try{
        const coupon = await couponModel.findById(id);
        return {success:true,coupon:coupon};  
    }
    catch(error){
        console.error('Error in getDiscountById:', error.message);
        return { success: false, error: 'Failed to retrieve discount by id' };
    }   
    
    
}



module.exports = {
    generateCouponService,
    updateCouponServicebyId,
    getAllCouponService,
    getAllCoupoByCategoryService,
    deleteCouponByIdService,
    getCouponByCodeService,
    getDiscountByCoupon,
    getCouponByTypeService,
    getDiscountById
}