const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./model');
const {generateOTP}=require('../../utility/common'); 
const { NotFound, BadRequest } = require('../../utility/errors');
const crypto = require('crypto');
const { otpMail } = require('../../utility/email');
const{SendEmailUtility}=require('../../utility/email');
const { error } = require('console');










//getAllUser
const getAllUsers=async(data)=>{
    const user=await User.find();
    return user;
}

 
const userResetLink = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
  
    const otp = crypto.randomInt(1000, 9999);
    const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP valid for 15 minutes
  
    user.otp = otp;
    user.otpExpiry = new Date(otpExpiry);
    await user.save();
  
    // Send OTP to user's email using SendEmailUtility function
    await SendEmailUtility(email, 'OTP for Password Reset', `Your OTP for password reset is: ${otp}`);
  
    return user;
  };


// verify OTP

const verifyOTP = async (email, otp) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.otp || !user.otpExpiry) {
      throw new Error('OTP not requested');
    }
  
    if (user.otp !== otp) {
      throw new Error('Incorrect OTP');
    }
  
    if (user.otpExpiry < Date.now()) {
      throw new Error('Expired OTP');
    }
  
    user.otp = null; // Clear OTP
    user.otpExpiry = null; // Clear OTP expiry
    await user.save();
  
    return true;
  };



// ResetPassword with verification

const resetPass = async (email, newPassword) => {
    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Construct the update object to set the new hashed password
        const update = { password: hashedPassword };

    console.log("Updating password for email:", email);

    // Find the user by email and update the password
    const user = await User.findOneAndUpdate({ email: email }, update, {
      new: true,
    });

    console.log("Updated user:", user);

    if (!user) {
      throw new BadRequest("User not found with this email");
    }

        return user;
    } catch (error) {
        throw new Error('Failed to reset password.');
    }
  };

const updateUserService = async (id, data) => {
    try {
      if(!data){
        throw new Error('data is required');
      }
      const user = await User.findByIdAndUpdate(id, data,{new:true});
      if (!user) {
        throw new NotFound('User not found');
      }
      return user;
    }
    catch (error) {
      throw new Error('Failed to update user');
    }};





module.exports = {

  getAllUsers,
  userResetLink,
  verifyOTP,
  resetPass,
  updateUserService
 
};
