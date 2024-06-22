const express=require('express');
const router=express.Router();
const { asyncHandler } =require('../../utility/common');
const customerService = require('./service')
const authMiddleware= require('../../middlewares/authMiddleware');
const roleMiddleware= require('../../middlewares/roleMiddleware');
const { HEAD_OFFICE,BRANCH_ADMIN } = require('../../config/constants');


const createCustomerhandler = asyncHandler(async (req, res) => {
  const customer = await customerService.customerCreateService(req.body);
  
    res.status(200).json({
      message: "customer added successfully",
      customer,
    });
  
});



const getAllCustomerhandler = asyncHandler(async (req, res) => {
    const customer = await customerService.getAllCustomerService();
    res.status(200).json({
        message: "customer get successfully",
        customer
    });
});


const forgetCredentialshandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await customerService.forgetInfoService(email);
  res.status(200).json({
      message: "OTP is sent to email",
      email
  });
});







const otpVerifyHandler = asyncHandler(async(req,res)=>{
    const { email, otp } = req.body;
    const verify=await customerService.verifyOTP(email,otp)
    
      res.json({
         message: 'OTP verified successfully',
         verify
        });
  });




  const expireOTP = asyncHandler(async(req,res)=>{
    await customerService.expireOTP(req.body);
  
    res.status(200).json({
      message: 'OTP expired',

    });
  })



  const customerSignInHandler = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

      const user = await customerService.customerSignInService(email, password);
      res.status(200).json({
        message: 'User signed in successfully.',
        user
      });
   
  
  });






 // resetPassword With Verification
const resetPassHandler = asyncHandler(async(req,res)=>{
  const { email, newPassword } = req.body;

  await customerService.resetPass(email, newPassword);
  res.status(200).send('Password reset successfully');

})




const updateCustomerHandler = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  const customer = await customerService.updateCustomerService(id, req.body);
  res.status(200).json({
    message: "Customer Updated Successfully!",
    customer
  });
});
  







router.post('/createCustomer',createCustomerhandler);
router.get('/getCustomer',authMiddleware,roleMiddleware([HEAD_OFFICE,BRANCH_ADMIN]),getAllCustomerhandler);
router.post('/forgetCred',forgetCredentialshandler);
router.post('/otpverify',otpVerifyHandler);
router.post('/expiredOtp',expireOTP);
router.post('/customerSignIn',customerSignInHandler);
router.put('/resetPassword',resetPassHandler);
router.patch('/updateCustomer/:id',updateCustomerHandler);
module.exports = router;
