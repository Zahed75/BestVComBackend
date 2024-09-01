const customerModel = require("../Customer/model");
const { generateOTP } = require("../../utility/common");
const { SendEmailUtility } = require("../../utility/email");
const productModel = require("../Products/model");
const Order = require('../Order/model');
const toBengaliNum = require("number-to-bengali");
const sendSMS = require("../../utility/aamarPayOTP");

const {
  BadRequest,
  Unauthorized,
  Forbidden,
  NoContent,
} = require("../../utility/errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { CUSTOMER } = require("../../config/constants");

const createToken = require("../../utility/createToken");




const customerCreateService = async (customerInfo) => {
  try {
    // Generate OTP
    const otp = generateOTP();
    customerInfo.otp = otp;

    // Create new customer
    const newCustomer = await customerModel.create(customerInfo);

    // Send OTP email
    await SendEmailUtility(newCustomer.email, otp);

    return {
      message: "Customer added successfully and OTP sent",
      customer: newCustomer,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create customer: " + error.message);
  }
};




const getAllCustomerService = async () => {
 
    const newCustomer = await customerModel.find();
    return newCustomer;
  
};





const forgetInfoService = async (email) => {
  try {
    // Find the customer by email and phone number
    const customer = await customerModel.findOne({ email });
    if (!customer) {
      throw new Error("Customer not found");
    }
    // Generate OTP
    const otp = generateOTP();

    // Update the customer's OTP
    customer.otp = otp;
    await customer.save();

    // Send OTP email
    const emailText = `Your OTP is ${otp}`;
    await SendEmailUtility(email, emailText, "Password Reset OTP");

    console.log("OTP sent successfully");
  } catch (error) {
    console.error(error);
    throw error;
  }
};



// Verify OTP
const verifyOTP = async (email, otp) => {
  try {
    const user = await customerModel.findOne({ email, otp });
    if (!user) {
      throw new BadRequest("Invalid OTP.");
    }
    user.isActive = true;
    user.isVerified = true;
    user.otp = undefined; // Clear OTP after verification
    await user.save();
  } catch (error) {
    throw new BadRequest("Failed to verify OTP.");
  }
};

const expireOTP = async (data) => {
  const { email } = data;
  await customerModel.updateOne({ email }, { $unset: { otp: 1 } });
  return;
};


const customerSignInService = async (email, password) => {
  try {
    // Find user by email
    const user = await customerModel.findOne({ email });

    // Check if user exists
    if (!user) {
      throw new BadRequest("Invalid email or password.");
    }

    // Validate password using bcrypt.compare
    const isMatch = bcrypt.compare(password, user.password);

    // Check password match
    if (!isMatch) {
      throw new BadRequest("Invalid email or password.");
    }
    // Generate JWT token with user data payloads
    const accessToken = jwt.sign({ user }, "SecretKey12345", {
      expiresIn: "3d",
    });

    // User is authenticated, return sanitized user data (excluding sensitive fields)
    const sanitizedUser = {
      accessToken,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: true,
      userId: user._id,
      // isVerified: user.isVerified,
    };

    return sanitizedUser;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


const resetPass = async (email, newPassword) => {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Construct the update object to set the new hashed password
    const update = { password: hashedPassword };

    console.log("Updating password for email:", email);

    // Find the user by email and update the password
    const user = await customerModel.findOneAndUpdate(
      { email: email },
      update,
      { new: true }
    );

    console.log("Updated user:", user);

    if (!user) {
      throw new BadRequest("User not found with this email");
    }

    return user;
  } catch (error) {
    throw new Error("Failed to reset password.");
  }
};





const updateCustomerService = async (customerId, customerData) => {
  try {
    const updatedCustomer = await customerModel.findByIdAndUpdate(
      customerId,
      customerData,
      { new: true }
    );
    return updatedCustomer;
  } catch (error) {
    throw error;
  }
};



const getCustomerInfoById = async (id) => {
  try {
    const customer = await customerModel.findById(id);
    return customer;
  } catch (error) {
    throw new Error('Error retrieving customer information');
  }
};




// services/customerService.js

const registerCustomerByPhoneNumber = async (customer) => {
  const { phoneNumber, firstName } = customer;

  if (!phoneNumber || !firstName) {
    throw new BadRequest("First name and phone number are required");
  }

  const existingCustomer = await customerModel.findOne({ phoneNumber });
  const otp = generateOTP();
  const message = `(BestElectronics) সম্মানিত গ্রাহক, চার সংখ্যার ওটিপি: ${toBengaliNum(
    otp
  )} ব্যবহার করে আপনার মোবাইল নম্বর ভেরিফিকেশন করুন।`;

  if (existingCustomer) {
    if (existingCustomer.isValid) {
      throw new BadRequest("You already have an account with this phone number. Please login");
    } else {
      // Update existing customer with new OTP
      const updatedCustomer = await customerModel.findOneAndUpdate(
        { phoneNumber },
        { otp },
        { new: true }
      );

      await sendSMS(phoneNumber, message);

      return updatedCustomer;
    }
  }

  const newCustomer = new customerModel({
    phoneNumber,
    firstName,
    otp
  });

  await newCustomer.save();

  await sendSMS(phoneNumber, message);

  return newCustomer;
};









// verify customer OTP

const verifyCustomerOTP = async (customer) => {
  const { phoneNumber, otp } = customer;

  const isCustomer = await customerModel.findOne({ phoneNumber })

  if (!isCustomer)
    throw new NotFound(
      "You do not have an account with this phone number. Please register"
    );

  if (Number(otp) !== isCustomer.otp) throw new BadRequest("Invalid OTP code");

  isCustomer.otp = undefined;
  isCustomer.isValid = true;

  const accessToken = createToken(
    {
      userId: isCustomer._id,
      role: CUSTOMER,
    },
    { expiresIn: "360d" }
  );

  //customer refresh Token
  const refreshToken = createToken(
    {
      userId: isCustomer._id,
      role: CUSTOMER,
    },
    { expiresIn: "360d" }
  );

  isCustomer.refreshToken = refreshToken;

  await isCustomer.save();

  isCustomer.refreshToken = undefined;

  return { customer: isCustomer, accessToken, refreshToken };
};







const loginCustomer = async (customer) => {
  const { phoneNumber } = customer;

  const customerExist = await customerModel.findOne({ phoneNumber })
  if (!customerExist)
    throw new NotFound(
      "You do not have an account with this phone number. Please register"
    );
  const otp = generateOTP();
  const message = `সম্মানিত গ্রাহক,\nচার সংখ্যার ওটিপি (OTP): ${toBengaliNum(
    otp
  )} ব্যবহার করে আপনার মোবাইল নম্বর ভেরিফিকেশন করুন। -BestElectronics`;

  customerExist.otp = otp;
  await sendSMS(message, phoneNumber);

  await customerExist.save();

  return customerExist;
};






const resendCustomerOTP = async (customer) => {
  const { phoneNumber } = customer;

  const isCustomer = await customerModel.findOne({ phoneNumber });

  if (!isCustomer)
    throw new NotFound(
      "You do not have an account with this phone number. Please register"
    );

  const otp = generateOTP();
  const message = `সম্মানিত গ্রাহক,\nচার সংখ্যার ওটিপি (OTP): ${toBengaliNum(
    otp
  )} ব্যবহার করে আপনার মোবাইল নম্বর ভেরিফিকেশন করুন। -BestElectronics`;
  isCustomer.otp = otp;
  await sendSMS(message, phoneNumber);

  await isCustomer.save();

  return isCustomer;
};







module.exports = {
  updateCustomerService,
  customerCreateService,
  getAllCustomerService,
  forgetInfoService,
  verifyOTP,
  expireOTP,
  customerSignInService,
  resetPass,
  getCustomerInfoById,
  registerCustomerByPhoneNumber,
  verifyCustomerOTP,
  loginCustomer,
  resendCustomerOTP

};
