const express = require("express");
const router = express.Router();

const userService = require("../User/service");

const {
  brandManagerValidate,
  changeUserDetailsValidate,
  changePasswordValidate,
} = require("./request");

const authMiddleware = require("../../middlewares/authMiddleware");
roleMiddleware = require("../../middlewares/roleMiddleware");
const handleValidation = require("../../middlewares/schemaValidation");
const { asyncHandler } = require("../../utility/common");
const { HEAD_OFFICE, BRANCH_ADMIN } = require("../../config/constants");









// getAllUsers

const getAllUsersHandler = asyncHandler(async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      message: "User get successfully",
      users,
    });
  } catch (err) {
    throw new err();
  }
});

// Route to request OTP

const userResetHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await userService.userResetLink(email);
  res.status(200).json({
    message: "OTP sent successfully",
  });
});

// verifyOTP for the forgetPassword

const verifyOTPHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await userService.verifyOTP(email, otp);
  res.status(200).json({
    message: "OTP verified successfully",
  });
});




// resetPassword With Verification
const resetPassHandler = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  await userService.resetPass(email, newPassword);
  res.status(200).send("Password reset successfully");
});





const updateUserDetailsHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await userService.updateUserService(id, req.body);
  res.status(200).json({
    message: "User updated successfully",
    user,
  })
});





const changePassword = async (req, res) => {
  try {
    // Extract user ID from req.body
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'User ID, current password, new password, and confirm password are required' });
    }

    // Call the service to change the password
    const result = await userService.changePassword(userId, currentPassword, newPassword, confirmPassword);

    // Return the result
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};








// router.post('/resetPass',resetPasswordHandler);
router.get(
  "/allUsers",
  authMiddleware,
  roleMiddleware([HEAD_OFFICE, BRANCH_ADMIN]),
  getAllUsersHandler
);
router.post("/resetUser", userResetHandler);
router.post("/checkOTP", verifyOTPHandler);
router.post("/setPassword", resetPassHandler);

router.put(
  "/updateUserDetails/:id",
  updateUserDetailsHandler
);

router.patch('/change-password',changePassword);


module.exports = router;
