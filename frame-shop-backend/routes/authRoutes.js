// Secure authentication routes with comprehensive security middleware
const express = require("express");
const { 
  register, 
  login, 
  verifyOtp, 
  setupMFA, 
  verifyMFA, 
  getProfile, 
  updateProfile, 
  changePassword, 
  logout 
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/setup-mfa", protect, setupMFA);
router.post("/verify-mfa", verifyMFA);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

module.exports = router;