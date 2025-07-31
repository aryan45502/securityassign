const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const passwordUtils = require("../utils/passwordUtils");
const AuditLog = require("../models/AuditLog");

// Get user's orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    // For now, return empty array since we don't have orders implemented
    res.json({
      success: true,
      orders: []
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
});

// Test endpoint to check if user is authenticated
router.get("/test-auth", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Authentication working",
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      }
    });
  } catch (error) {
    console.error("Test auth error:", error);
    res.status(500).json({
      success: false,
      message: "Test auth failed"
    });
  }
});

// Test endpoint to check password history
router.get("/password-history", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Password history retrieved",
      data: {
        historyCount: user.passwordHistory?.length || 0,
        passwordChangedAt: user.passwordChangedAt,
        passwordExpiresAt: user.passwordExpiresAt,
        historyEntries: user.passwordHistory?.map(entry => ({
          changedAt: entry.changedAt,
          passwordHash: entry.password.substring(0, 10) + '...' // Show partial hash for security
        })) || []
      }
    });
  } catch (error) {
    console.error("Password history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get password history"
    });
  }
});

// Create new order
router.post("/", protect, async (req, res) => {
  try {
    const { appointments, totalAmount, paymentMethod } = req.body;
    
    // For now, just return success
    res.json({
      success: true,
      message: "Order created successfully",
      orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
});

// Change password with history validation
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordUtils.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordValidation = passwordUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        message: 'Password does not meet security requirements. Please ensure your password includes uppercase, lowercase, numbers, and special characters.',
        details: passwordValidation.details,
        requirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          minScore: 6
        }
      });
    }

    // Check password history - prevent reuse of previous passwords
    const historyCheck = passwordUtils.checkPasswordHistory(newPassword, user.passwordHistory);
    if (historyCheck.isReused) {
      return res.status(400).json({
        success: false,
        error: 'Password reuse not allowed',
        message: 'Cannot use a password that has been used previously. Please choose a different password.',
        details: {
          lastUsed: historyCheck.lastUsed,
          reusePolicy: 'Last 5 passwords cannot be reused',
          historyCount: user.passwordHistory.length
        }
      });
    }

    // Hash new password
    const hashedNewPassword = await passwordUtils.hashPassword(newPassword);

    // Save the OLD password to history BEFORE updating
    console.log(`🔐 SAVING OLD PASSWORD TO HISTORY for user ${user.email}`);
    console.log(`📊 Password history before: ${user.passwordHistory?.length || 0} entries`);
    
    user.passwordHistory.push({
      password: user.password, // This is the old password
      changedAt: new Date()
    });

    // Update password and related fields
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    user.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    // Keep only last 5 passwords in history
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }
    
    console.log(`📊 Password history after: ${user.passwordHistory.length} entries`);
    console.log(`✅ OLD PASSWORD SAVED - User cannot reuse it in future changes`);

    await user.save();

    // Log password change for security audit
    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_CHANGE',
      resourceType: 'USER',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      details: { 
        passwordChangedAt: user.passwordChangedAt,
        passwordExpiresAt: user.passwordExpiresAt,
        historyLength: user.passwordHistory.length
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      details: {
        changedAt: user.passwordChangedAt,
        expiresAt: user.passwordExpiresAt,
        passwordHistoryCount: user.passwordHistory.length
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: 'An error occurred while changing password. Please try again.'
    });
  }
});

module.exports = router; 