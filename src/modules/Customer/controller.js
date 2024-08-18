const express=require('express');
const router=express.Router();
const { asyncHandler } =require('../../utility/common');
const customerService = require('./service')
const authMiddleware= require('../../middlewares/authMiddleware');
const roleMiddleware= require('../../middlewares/roleMiddleware');
const { HEAD_OFFICE,BRANCH_ADMIN, MANAGER,ADMIN, CUSTOMER } = require('../../config/constants');



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



const updateCustomerHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.updateCustomerService(id, req.body);
  res.status(200).json({
    message: "Customer Updated Successfully!",
    customer
  });
});





const getCustomerInfoByIdHandler = asyncHandler(async(req,res)=>{

    const customerId = req.params.id;
    const customerInfo = await customerService.getCustomerInfoById(customerId);
   return res.status(200).json({
    message:"Customer Information Fetched Successfully",
    customerInfo
   })
  
})



const registerCustomerByPhoneNumber = asyncHandler(async (req, res) => {
  const { firstName, phoneNumber } = req.body;

  // Validate input
  if (!firstName || !phoneNumber) {
    return res.status(400).json({ message: "First name and phone number are required" });
  }

  try {
    const result = await customerService.registerCustomerByPhoneNumber({ firstName, phoneNumber });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});





const customerVerifyOTPHandler = async (req, res, next) => {
  try {
    const { customer, accessToken, refreshToken } =
      await customerService.verifyCustomerOTP(req.body);

    res.cookie("currentUserRole", CUSTOMER, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "OTP verification successful",
      user: customer,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err, req, res);
  }
};


const customerOTPSigninHandler = async (req, res, next) => {
  try {
    const customer = await customerService.loginCustomer(req.body);

    res.status(200).json({
      message: "OTP send to your phone number",
      customer,
    });
  } catch (err) {
    next(err, req, res);
  }
};



router.post('/createCustomer',createCustomerhandler);
router.get('/getCustomer',roleMiddleware([HEAD_OFFICE]),getAllCustomerhandler);
router.post('/forgetCred',forgetCredentialshandler);
router.post('/otpverify',otpVerifyHandler);
router.post('/expiredOtp',expireOTP);
router.post('/customerSignIn',customerSignInHandler);
router.put('/resetPassword',resetPassHandler);
router.patch('/updateCustomer/:id',updateCustomerHandler);
router.get('/info/:id',getCustomerInfoByIdHandler);

router.post('/registerByPhone',registerCustomerByPhoneNumber);

router.post('/verifyPhoneOtp',customerVerifyOTPHandler)

router.post('/loginPhoneOTP',customerOTPSigninHandler)

module.exports = router;
