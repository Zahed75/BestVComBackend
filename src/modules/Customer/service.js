const customerModel = require("../Customer/model");
const { generateOTP } = require("../../utility/common");
const { SendEmailUtility } = require("../../utility/email");
const productModel = require("../Products/model");

const {
  BadRequest,
  Unauthorized,
  Forbidden,
  NoContent,
} = require("../../utility/errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
  try {
    const newCustomer = await customerModel.find();
    return { customer: newCustomer };
  } catch (error) {
    console.error(error);
    return { customer: null };
  }
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
    // Generate JWT token with user data payload
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

const addWishListService = async(userId, productIds)=>{
  const customer = await customerModel.findById(userId);
  if (!customer) {
    throw new Error('Customer not found');
  }
  const products = await productModel.find({
    _id: { $in: productIds }
});

if (!products || products.length !== productIds.length) {
    throw new Error('Products not found');
}
  // Ensure productIds is an array
  productIds = Array.isArray(productIds) ? productIds : [productIds];

  // Add each product ID to the wishlist
  for (const productId of productIds) {
    customer.wishList.push(productId);
  }

  await customer.save();
  return customer;
}

const getWishListService = async(userId)=>{
  const customer = await customerModel.findById(userId).populate('wishList');
  if (!customer) {
    throw new Error('Customer not found');
  }
  return customer.wishList;
}

// const removeWishListService = async(userId, productId) => {
//   const customer = await customerModel.findById(userId);
//   if (!customer) {
//     throw new Error('Customer not found');
//   }

//   const index = customer.wishList.indexOf(productId);
//   if (index !== -1) {
//     customer.wishList.splice(index, 1);
//   }

//   await customer.save();
//   return customer;
// }

const removeWishListService = async (userId, productIds) => {
  const customer = await customerModel.findById(userId);
  if (!customer) {
    throw new Error('Customer not found');
  }
//remove multiple products from wishlist
  customer.wishList = customer.wishList.filter(id => !productIds.includes(id.toString()));
  await customer.save();

  return customer;
};

module.exports = {
  customerCreateService,
  getAllCustomerService,
  forgetInfoService,
  verifyOTP,
  expireOTP,
  customerSignInService,
  resetPass,
  addWishListService,
  getWishListService,
  removeWishListService
};
