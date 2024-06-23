const OrderModel = require('../Order/model');
const ProductModel = require('../Products/model');
const CouponModel = require('../Discount/model');
const { BadRequest, NotFound } = require('../../utility/errors');
const CustomerModel = require('../Customer/model');
const { v4: uuidv4 } = require('uuid');

const { generateCustomOrderId, formatOrderTime } = require('../../utility/customOrder');

function calculateOrderValue(products, orderProducts) {
  return orderProducts.reduce((total, orderProduct) => {
    const product = products.find(p => p._id.equals(orderProduct._id));
    if (product && product.general && typeof product.general.regularPrice === 'number' && orderProduct.quantity && typeof orderProduct.quantity === 'number') {
      return total + (product.general.regularPrice * orderProduct.quantity);
    } else {
      console.warn('Invalid product or quantity:', orderProduct);
      return total;
    }
  }, 0);
}




// Define calculateDiscount function
function calculateDiscount(coupon, totalPrice) {
  if (!coupon) {
    return 0; // No coupon, so no discount
  }

  if (coupon.discountType === 'percentage') {
    return (coupon.couponAmount / 100) * totalPrice;
  } else if (coupon.discountType === 'fixed') {
    return coupon.couponAmount;
  } else {
    return 0; // Unknown discount type, so no discount
  }
}



const createOrder = async (orderData) => {
  try {
    // Generate custom orderId
    const orderId = generateCustomOrderId();
    const orderTime = formatOrderTime(new Date());

    const { email, orderType, deliveryAddress, 
      deliveryCharge = 0, district, phoneNumber,
       paymentMethod, transactionId, products, couponId, 
       vatRate,
       firstName,
       lastName
       } = orderData;

    // Validate request body
    if (!email || !orderType || !deliveryAddress || !district || !phoneNumber || !paymentMethod || !products || !firstName || !lastName) {
      throw new Error('Please provide all required fields');
    }

    // Find the customer by email
    const customer = await CustomerModel.findOne({ email });
    if (!customer) {
      throw new Error('Customer not found');
    }


    const customerFirstName = await CustomerModel.findOne({ firstName });
    if (!customer) {
      throw new Error('Customer not found');
    }

    const customerLastName = await CustomerModel.findOne({ lastName });
    if (!customer) {
      throw new Error('Customer not found');
    }


   
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products provided');
    }

    // Check if all products have a quantity field
    for (const product of products) {
      if (!product.quantity || typeof product.quantity !== 'number') {
        throw new Error('Each product must have a valid quantity');
      }
    }

    const productIds = products.map(product => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } });

    if (validProducts.length !== products.length) {
      throw new Error('Invalid product IDs');
    }

    // Log valid products to debug
    console.log('Valid Products:', validProducts);

    // Calculate total price using the quantity of each product
    let totalPrice = calculateOrderValue(validProducts, products);

    // Log totalPrice to debug
    console.log('Total Price:', totalPrice);

    // Apply discount if coupon provided
    let discountAmount = 0;
    if (couponId) {
      const coupon = await CouponModel.findById(couponId);
      if (!coupon) {
        throw new Error('Invalid coupon ID');
      }
      discountAmount = calculateDiscount(coupon, totalPrice);
      // Log discountAmount to debug
      console.log('Discount Amount:', discountAmount);
    }

    // Check if discountAmount is valid
    if (isNaN(discountAmount) || discountAmount < 0 || discountAmount > totalPrice) {
      throw new Error('Invalid discount amount');
    }

    // Calculate VAT
    const vat = (vatRate / 100) * totalPrice;

    // Log VAT to debug
    console.log('VAT:', vat);
    console.log(discountAmount, deliveryCharge);

    // Calculate final total price including discount and VAT
    const finalTotalPrice = totalPrice - discountAmount + vat + deliveryCharge;

    // Log finalTotalPrice to debug
    console.log('Final Total Price:', finalTotalPrice);

    // Create new order
    const newOrder = new OrderModel({
      orderId,
      customer: customer._id,
      firstName,
      lastName,
      orderType,
      orderTime,
      deliveryAddress,
      orderStatus: 'Received', // Assign the correct status string
      district,
      phoneNumber,
      paymentMethod,
      transactionId,
      products,
      coupon: couponId ? couponId : null,
      discountAmount,
      totalPrice: finalTotalPrice, // Assign final total price
      vatRate,
      deliveryCharge,
      customerFirstName,
      customerLastName,
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    return {
      message: "Order created successfully",
      createdOrder: {
        order: savedOrder,
        customerEmail: customer.email,
        customerFirstName:customer.firstName,
        customerLastName:customer.lastName,
        totalOrderValue: finalTotalPrice 
      }
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};














//updateOrderByOrder ID

const updateOrder = async (orderId, orderData) => {

    // Find the order by OrderId and update it with the provided data
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, orderData, { new: true });
    return updatedOrder;
  
};

// delete OrderBy ID

const deleteOrder = async (orderId) => {
  try {
    // Find the order by OrderId and delete it
    await OrderModel.findByIdAndDelete(orderId);
  } catch (error) {
    throw error;
  }
};




const getAllOrders = async () => {
  try {
    const orders = await OrderModel.find().populate({
      path: 'products._id',
      model: 'Product',
      select: 'productName productImage general.regularPrice inventory.sku general.salePrice'
    }).populate({
      path: 'customer',
      model: 'customer',
      select: 'firstName lastName email phoneNumber district address'
    });

    const formattedOrders = orders.map(order => {
      return {
        ...order.toObject(),
        products: order.products.map(productItem => {
          const productDetails = productItem._id;
          return {
            _id: productDetails._id,
            productName: productDetails.productName,
            productImage: productDetails.productImage,
            sku: productDetails.inventory.sku,
            quantity: productItem.quantity,
            price: productDetails.general.regularPrice,
            offerPrice: productDetails.general.salePrice,
            totalPrice: productDetails.general.salePrice * productItem.quantity,
          };
        }),
        customer: order.customer ? {
          _id: order.customer._id,
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
          phoneNumber: order.customer.phoneNumber,
          district: order.customer.district,
          address: order.customer.address,
        } : null,
      };
    });

    return formattedOrders;
  } catch (error) {
    console.error("Error retrieving orders:", error);
    throw error;
  }
};









// Update Order Status
const updateOrderStatus = async (id, updateOrder) => {
  const { orderStatus } = updateOrder;

  const order = await OrderModel.findByIdAndUpdate({ _id: id }, updateOrder, {
    new: true,
  });

  if (!order) throw new NotFound("Order not found");

  const isLogged = order.orderLogs.find(
    (log) => log.status === Number(orderStatus)
  );

  if (!isLogged) {
    order.orderLogs.push({
      status: Number(orderStatus),
      createdAt: new Date(),
    });

    await order.save();

  }
}


const getOrderById = async (id) => {
  try {
    const orderInfo = await OrderModel.findById(id)
      .populate({
        path: 'products._id',
        model: 'Product',
        select: 'productName productImage general.regularPrice inventory.sku general.salePrice'
      })
      .populate({
        path: 'customer',
        model: 'customer',
        select: 'firstName lastName email phoneNumber district address'
      });

    if (!orderInfo) {
      throw new NotFound("Order not found");
    }

    const formattedOrder = {
      ...orderInfo.toObject(),
      products: orderInfo.products.map(productItem => {
        const productDetails = productItem._id;
        return {
          _id: productDetails._id,
          productName: productDetails.productName,
          productImage: productDetails.productImage,
          sku: productDetails.inventory.sku,
          quantity: productItem.quantity,
          price: productDetails.general.regularPrice,
          offerPrice: productDetails.general.salePrice,
          totalPrice: productDetails.general.salePrice * productItem.quantity,
        };
      }),
      customer: orderInfo.customer ? {
        _id: orderInfo.customer._id,
        firstName: orderInfo.customer.firstName,
        lastName: orderInfo.customer.lastName,
        email: orderInfo.customer.email,
        phoneNumber: orderInfo.customer.phoneNumber,
        district: orderInfo.customer.district,
        address: orderInfo.customer.address,
      } : null,
    };

    return { success: true, order: formattedOrder };
  } catch (error) {
    console.error('Error in getOrderById:', error.message);
    return { success: false, error: error.message };
  }
};




const getCustomerHistory = async (customerId) => {
  try {
    const orderInfo = await OrderModel.find({ customer: customerId });
    const totalOrders = orderInfo.length;
    let totalOrderValue = 0;
    for (const order of orderInfo) {
      totalOrderValue += order.totalPrice;
    }
    const averageOrderValue = totalOrderValue / totalOrders;
    return { totalOrders, averageOrderValue };
  } catch (error) {
    console.error('Error in getCustomerHistory:', error.message);
    throw error;
  }
}








// update OrderNoteStatus

const updateOrderNoteById = async (orderId, orderNote) => {

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { orderNote } },
      { new: true } // To return the updated document
    );

    if (!updatedOrder) {
      throw new NotFound("Order not found");
    }

    return { success: true, order: updatedOrder };
  
};


module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  getCustomerHistory,
  updateOrderNoteById
};
