const express=require('express');
const router=express.Router();
const { asyncHandler } =require('../../utility/common');
const discountService = require('./service');
const { addSubcategory } = require('../Category/service');


const couponGenerateHandler = asyncHandler(async (req, res) => {
    try {
      const couponInfo = req.body;
      const { couponInfo: coupon } = await discountService.generateCouponService(couponInfo);
      
      res.status(200).json({
        message: "Coupon added successfully",
        coupon
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  });


  const couponUpdateHandler = asyncHandler(async (req, res) => {
    const couponId = req.params.id;
    const updatedInfo = req.body;

    const { success, data, error } = await discountService.updateCouponServicebyId(couponId, updatedInfo);

    if (success) {
        res.status(200).json({
            message: "Coupon updated successfully",
            couponUpdates: data
        });
    } else {
        res.status(400).json({
            message: "Failed to update coupon",
            error
        });
    }
});


const getAllCouponHandler = asyncHandler(async (req, res) => {
    const { success, data, error } = await discountService.getAllCouponService();

    if (success) {
        res.status(200).json({
            message: "Coupons retrieved successfully",
            coupons: data
        });
    } else {
        res.status(500).json({
            message: error
        });
    }
});
const getAllCouponByCategoryHandler = asyncHandler(async(req,res)=>{
    const categoryId = req.params.categoryId;
    const { success, data, error } = await discountService.getAllCoupoByCategoryService(categoryId)
    if (success) {
        res.status(200).json({
            message: "Coupons retrieved successfully",
            coupons: data
        });
    } else {
        res.status(500).json({
            message: error
        });
    }
})

const deleteCouponByIdHandler = asyncHandler(async (req, res) => {
    const couponId = req.params.id;
    const { success, data, error } = await discountService.deleteCouponByIdService(couponId);
    if (success) {
        res.status(200).json({ message: 'Coupon deleted successfully',data :data});
    } else  {
        res.status(500).json({
            message: error
        });
    }
});

const getCouponByCodeHandler = asyncHandler(async (req, res) => {
    const couponCode = req.params.code;
    const { success, data , error }  = await discountService.getCouponByCodeService(couponCode);
    if (success) {
        res.status(200).json({ data });
    } else {
        res.status(404).json({ message: error });
    }
});


const getDiscountByCouponHandler = asyncHandler(async(req,res)=>{
    const couponId = req.params.couponId;
    const userId = req.params.userId;
    const {totalPrice,requestedProducts} = req.body;
    const discountAmount = await discountService.getDiscountByCoupon(couponId,totalPrice,requestedProducts,userId);
    if(discountAmount){
        res.status(200).json({discountAmount})
    }
    else {
        res.status(404).json({ message: 'Coupon coudnt get authorized' });
    }
})

const getCouponByTypeHandler = asyncHandler(async (req, res) => {
    const discountType = req.params.discountType;
    const validDiscountTypes = ["fixed", "percentage"];
    
    if (!validDiscountTypes.includes(discountType)) {
        return res.status(400).json({ message: 'Invalid discount type' });
    }

    const coupons = await discountService.getCouponByTypeService(discountType);
    if (coupons.length > 0) {
        res.status(200).json({ coupon: coupons });
    } else {
        res.status(404).json({ message: 'No coupons found for the specified discount type' });
    }
});

const getCouponByIdHandler = asyncHandler(async (req, res) => { 
    const couponId = req.params.id;
    const {success,coupon,error} = await discountService.getDiscountById(couponId);
    if (success) {
        res.status(200).json({ coupon });
    } else {
        res.status(404).json({ message: 'Coupon not found',error});
    }

})



router.post('/createCoupon',couponGenerateHandler);
router.put('/updateCoupon/:id',couponUpdateHandler);
router.get('/getAllCoupon',getAllCouponHandler);
router.get('/getAllCouponByCat/:categoryId',getAllCouponByCategoryHandler);
router.delete('/deleteCouponById/:id', deleteCouponByIdHandler);
router.get('/getCouponByCode/:code', getCouponByCodeHandler);
router.get('/getDsicountByCode/:couponId/:userId', getDiscountByCouponHandler);
router.get('/getCouponByTypeHandler/:discountType', getCouponByTypeHandler);
router.get('/getCouponById/:id',getCouponByIdHandler);
module.exports = router;