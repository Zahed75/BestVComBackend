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


const {convertTo4Digit } = require('../../utility/common');
const sendSMS = require('../../utility/aamarPayOTP');



// Admin Register a new user


const UserRegister = async (email, phoneNumber, password, role, firstName, lastName, profilePicture) => {
  try {
    // Generate OTP
    const otp = generateOTP();

    const user = new User({
      email,
      phoneNumber,
      role,
      otp,
      password,
      firstName,
      lastName,
      profilePicture,
    
    });

    await user.save();

    // Send OTP to email
    await SendEmailUtility(email, 'OTP for registration', `Your OTP for registration: ${otp}`);

    // Return user
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};



const registerUserByPhoneNumber = async (phoneNumber) => {
  const otp = generateOTP();

  let user = await User.findOne({ phoneNumber });
  if (!user) {
    user = new User({ phoneNumber, otp, otpExpiry: Date.now() + 10 * 60000 });
  } else {
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60000;
  }
  await user.save();

  await sendSMS(phoneNumber, `Your OTP code is ${convertTo4Digit(otp)}`);

  return user;
};




const verifyOTPByPhone = async (phoneNumber, otp) => {
  const user = await User.findOne({ phoneNumber, otp });
  if (!user) {
    throw new BadRequest('Invalid OTP.');
  }

  // Clear OTP and set user as active and verified
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isActive = true;
  user.isVerified = true;
  await user.save();

  // Generate JWT token for user
  const token = jwt.sign({ userId: user._id }, 'SecretKey12345', { expiresIn: '1h' });

  return { user, token };
};







const resendOTPbyPhone = async (phoneNumber) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) {
    throw new Error('User not found');
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = Date.now() + 10 * 60000; // Extend OTP expiry by 10 minutes
  await user.save();

  await sendSMS(phoneNumber, `Your new OTP code is ${convertTo4Digit(otp)}`);

  return user;
};





//User Creation
const addUsers = async ({ email, phoneNumber, firstName, lastName, password, role, outletId, profilePicture, userName }) => {
  try {
    // Ensure a valid role is provided
    if (!['HQ', 'BA', 'AD', 'MGR'].includes(role)) {
      throw new Error('Invalid role');
    }

    // Ensure a valid phone number is provided (simple regex check)
    const phoneRegex = /^[0-9]{10,15}$/; // Adjust regex based on your specific phone number format requirements
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Must be a valid phone number');
    }

    // Ensure email is unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Create the user
    const user = await User.create({
      email,
      outlet: outletId,
      phoneNumber,
      password,
      role,
      firstName,
      lastName,
      userName,
      profilePicture,
      isActive: true,
      isVerified: true 
    });

    return { success: true, user };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  addUsers,
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





const getAllManagers = async () => {
  // Exclude users with role 'CUS'
  const users = await User.find({ role: { $ne: 'CUS' } }).select('-password -refreshToken'); // Exclude sensitive information
  return users;
};




const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error("Error retrieving user:", error);
    throw error;
  }
};




const deleteUserById = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return { status: 404, message: "User not found" };
    }
    return { status: 200, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { status: 500, message: "Internal server error" };
  }
};


const updateUserById = async (userId, userData) => {
  
    const updatedUser = await User.findByIdAndUpdate(userId, userData, { new: true });
    if (!updatedUser) {
      return { status: 404, message: "User not found" };
    }
    return { status: 200, message: "User updated successfully", user: updatedUser };

};








module.exports = {
  UserRegister,
  verifyOTP,
  resendOTP,
  expireOTP,
  signinUser,
  addUsers,
  getAllManagers,
  getUserById,
  deleteUserById,
  updateUserById,
  registerUserByPhoneNumber,
  verifyOTPByPhone,
  resendOTPbyPhone
};







