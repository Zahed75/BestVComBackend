const jwt = require('jsonwebtoken');
const User = require('../User/model');

const {
  BadRequest,
  Unauthorized,
  Forbidden,
  NoContent,
} = require('../../utility/errors');

const { generateOTP } = require('../../utility/common');

const { SendEmailUtility } = require('../../utility/email');
const createToken = require('../../utility/createToken');
const bcrypt = require('bcryptjs');
const { decrypt } = require('dotenv');






// Admin Register a new user

const UserRegister = async (email, phoneNumber, password, role) => {

    // Generate OTP
    const otp = generateOTP();


    const user = new User({
      email,
      phoneNumber,
      role,
      otp,
      password,
    });
    await user.save();

    // Send OTP to email
    await SendEmailUtility(email, 'OTP for registration', `Your OTP for registration: ${otp}`);

    // Return user
    return user;
 
};



//User Creation

const addUsers = async ({ email, phoneNumber, firstName, lastName, password, role, outletId, profilePicture }) => {
  try {
    // Ensure a valid role is provided
    if (!['HQ', 'BA', 'AD', 'MGR'].includes(role)) {
      throw new Error('Invalid role');
    }

    // Ensure a valid outlet ID is provided
    // if (!outletId || !isValidObjectId(outletId)) {
    //   throw new Error('Invalid outlet ID');
    // }

    // Ensure a valid phone number is provided (simple regex check)
    const phoneRegex = /^[0-9]{10,15}$/; // Adjust regex based on your specific phone number format requirements
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Must be a valid phone number');
    }

    // Create the user based on the provided role
    const user = await User.create({
      email,
      outlet: outletId,
      phoneNumber,
      password,
      role,
      firstName,
      lastName,
      profilePicture,
      isActive: true,
      isVerified: true // Optionally set user as active
    });

    return { success: true, user };
  } catch (error) {
    throw new Error(error.message);
  }
};

const isValidObjectId = (id) => {
  // Use mongoose or any other relevant library to validate ObjectId
  return /^[0-9a-fA-F]{24}$/.test(id);
};






// Verify OTP
const verifyOTP = async (email, otp) => {
  try {
    const user = await User.findOne({ email, otp });
    if (!user) {
      throw new BadRequest('Invalid OTP.');
    }

    // Update user
    user.isActive = true;
    user.isVerified = true;
    user.otp = undefined; // Clear OTP after verification
    await user.save();
  } catch (error) {
    throw new BadRequest('Failed to verify OTP.');
  }
};



// Resend OTP

const resendOTP = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequest('User not found.');
    }

    // Generate new OTP
    const newOTP = generateOTP();
    user.otp = newOTP;
    await user.save();

    // Send OTP to email
    await SendEmailUtility(email, 'New OTP', `Your new OTP: ${newOTP}`);

    return { message: 'New OTP sent successfully.' };
  } catch (error) {
    throw new BadRequest('Failed to resend OTP.');
  }
};


// Expire OTP
const expireOTP = async (data) => {
  const { email } = data;
  await User.updateOne(
    { email },
    { $unset: { otp: 1, changedEmail: 1, emailChangeOTP: 1 } }
  );
  return;
};



//SignIn Admin

const signinUser = async (email, password) => {
  try {

    const user = await User.findOne({ email });


    if (!user) {
      throw new BadRequest("Invalid email or password.");
    }

    // Validate password using bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch) {
      throw new BadRequest("Invalid email or password.");
    }

    const accessToken = jwt.sign({ user }, 'SecretKey12345', { expiresIn: '3d' });

    const sanitizedUser = {
      userId: user._id,
      accessToken,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,


    };

    return sanitizedUser;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  UserRegister,
  verifyOTP,
  resendOTP,
  expireOTP,
  signinUser,
  addUsers
};







