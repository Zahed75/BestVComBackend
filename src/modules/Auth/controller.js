const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/schemaValidation'); // Corrected import

const {
  HEAD_OFFICE,
  BRANCH_ADMIN,
  CUSTOMER
} = require('../../config/constants');

const authService = require('./service');
const { adminValidate } = require('./request');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');







// Register a new user

const registerHandler = asyncHandler(async (req, res) => {
  const { email, phoneNumber, password, role, firstName, lastName, profilePicture } = req.body;
  const user = await authService.UserRegister(email, phoneNumber, password, role, firstName, lastName, profilePicture);

  res.status(200).json({
    message: "Your account has been registered. Please check your email for the OTP.",
    email: user.email,
    user,
  });
});





// register UserByPhoneNumber

const registerUserByPhoneHandler = asyncHandler(async(req,res)=>{
  const { phoneNumber } = req.body;

  const user = await authService.registerUserByPhoneNumber(phoneNumber);
  res.status(200).json({ 
    message: 'OTP sent to your phone number', 
    userId: user._id 
  });

})



// verify OTP By Phone Number
const verifyOTPPhoneHandler = asyncHandler(async(req,res)=>{
  const { phoneNumber, otp } = req.body;
  const { user, token } = await authService.verifyOTPByPhone(phoneNumber, otp);
  res.status(200).json({ 
    message: 'OTP verified', 
    token,
    user
   });
 
})






const resendOTPbyPhoneHandler = asyncHandler(async(req,res)=>{
  const { phoneNumber } = req.body;

  const user = await authService.resendOTPbyPhone(phoneNumber);
  res.status(200).json({ message: 'New OTP sent to your phone number', userId: user._id });

})






const addUsersHandler = asyncHandler(async (req, res) => {
  const { email, phoneNumber, password, role, firstName, lastName, userName, profilePicture, outletId } = req.body;
  const user  = await authService.addUsers({ email, phoneNumber, password, role, firstName, lastName, userName, profilePicture, outletId });

  res.status(200).json({
    message: "Your account has been registered.",
    email: user.email,
    user
  });
});







// Verify OTP

const otpVerifyHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const verify = await authService.verifyOTP(email, otp)

  res.json({
    message: 'OTP verified successfully. User activated.',
    verify
  });
});



//Resend OTP

const resendOTPHandler = asyncHandler(async (req, res) => {

  const { email } = req.body;
  const otpResend = await authService.resendOTP(email);
  res.status(200).json({
    otpResend
  });


})

//Expire OTP
const expireOTP = async (req, res, next) => {
  try {
    await authService.expireOTP(req.body);

    res.status(200).json({
      message: 'OTP expired',
    });
  } catch (err) {
    next(err, req, res);
  }
};



//UserSignIn

const signInHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const response = await authService.signIn(email, password);
  res.status(200).json({
    messsage: "User signed in Successfully",
    response
  });
})



//SignInUser

const userSignInHandler = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await authService.signinUser(email, password);
    res.status(200).json({
      message: 'User signed in successfully.',
      user
    });
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
};





const getAllManagers = asyncHandler(async (req, res) => {
 
    const users = await authService.getAllManagers();
    res.status(200).json({
      message: "Successfully retrieved all users",
      users
    });
 
});





const getUserByIdHandler = asyncHandler(async (req, res) => {
 
    const userId = req.params.id;
    const user = await authService.getUserById(userId);
    res.status(200).json({
      message: "Successfully retrieved user",
      user
    });

});



const deleteUserByIdHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await authService.deleteUserById(userId);
  res.status(result.status).json(result);
});




const updateUserByIdHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userData = req.body;
  const result = await authService.updateUserById(userId, userData);
  res.status(result.status).json(result);
});


const refreshTokenHandler = async (req, res) => {
  const { email, token, refreshToken } = req.body;

  try {
    const result = await authService.refreshUserToken(email, token, refreshToken);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};







router.post('/adminRegister', registerHandler);
router.post('/otpVerification', otpVerifyHandler);
router.post('/otpResend', resendOTPHandler);
router.post('/expireOTP', expireOTP);
router.post('/signInAdmin', userSignInHandler)
router.post('/userManage', authMiddleware, addUsersHandler);
router.get('/managers', getAllManagers);
router.get('/users/:id',getUserByIdHandler);
router.delete('/users/:userId', deleteUserByIdHandler);
router.put('/users/:userId', updateUserByIdHandler);
router.post('/phoneRegister',registerUserByPhoneHandler);
router.post('/phoneOTP-Verify',verifyOTPPhoneHandler);
router.post('/resendOTPByPhone',resendOTPbyPhoneHandler);
router.post("/refreshToken", refreshTokenHandler);


module.exports = router;
