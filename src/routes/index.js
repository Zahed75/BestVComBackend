const express = require('express');
const router = express.Router();


//routes

//middlewares
const authVerifyMiddleware = require('../middlewares/authMiddleware');

//routes
const authRoute = require('../modules/Auth/controller');
const userRoute=require('../modules/User/controller');
const outletRoute = require('../modules/Outlet/controller')
const categoryRoute = require('../modules/Category/controller');
const customerRoute = require('../modules/Customer/controller');
const productRoute = require('../modules/Products/controller');
const discountRoute = require('../modules/Discount/controller');
const orderRoute = require('../modules/Order/controller');
const reportingRoute = require('../modules/Reporting/controller');
const wishListRoute = require('../modules/Wishlist/controller');

//EndPoint
router.use('/auth', authRoute);
router.use('/user',userRoute);
router.use('/outlet',outletRoute);
router.use('/category',categoryRoute);

router.use('/customer',customerRoute);

router.use('/product',productRoute);
router.use('/discount',discountRoute);
router.use('/order',orderRoute);
router.use('/reports',reportingRoute);
router.use('/wishlist',wishListRoute);

router.use(authVerifyMiddleware);

module.exports = router;