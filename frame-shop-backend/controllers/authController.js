const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const passwordUtils = require('../utils/passwordUtils');
const mfaUtils = require('../utils/mfaUtils');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const jwt = require('jsonwebtoken');

const authController = {
  // Register user
  register: async (req, res) => {
    try {
      const { name, email, phone, password, role = 'patient' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }

      // Validate password strength
      const passwordValidation = passwordUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Weak password',
          message: passwordValidation.error,
          details: passwordValidation.details
        });
      }

      // Hash password
      const hashedPassword = await passwordUtils.hashPassword(password);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const user = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        otp,
        otpExpires,
        passwordHistory: [{
          password: hashedPassword,
          changedAt: new Date()
        }],
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      });

      await user.save();

      // Send OTP via SMS
      await sendSMS.sendOTP(phone, otp);

      // Log registration
      await AuditLog.create({
        userId: user._id,
        action: 'REGISTER',
        resourceType: 'USER',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        details: { email, role }
      });

      res.status(201).json({
        message: 'Registration successful. Please verify your phone number.',
        userId: user._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create account. Please try again.'
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      console.log('🔍 LOGIN ATTEMPT:', { body: req.body, ip: req.ip });
      
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        console.log('❌ MISSING CREDENTIALS:', { email: !!email, password: !!password });
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Email and password are required'
        });
      }

      // Validate email format
      if (!email.includes('@')) {
        console.log('❌ INVALID EMAIL FORMAT:', email);
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please enter a valid email address'
        });
      }

      console.log('✅ INPUT VALIDATION PASSED');

      // Check IP-based brute force attempts
      if (req.bruteForceAttempts && req.bruteForceAttempts.count >= 10) {
        console.log(`🚫 BRUTE FORCE BLOCKED: IP ${req.ip} has ${req.bruteForceAttempts.count} failed attempts`);
        return res.status(429).json({
          error: 'BRUTE FORCE PROTECTION ACTIVATED',
          message: `🚫 Too many failed login attempts from this IP address (${req.bruteForceAttempts.count} attempts). Your IP is blocked for 15 minutes due to brute force protection.`,
          retryAfter: Math.ceil((15 * 60 * 1000) / 1000), // 15 minutes
          blockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          attempts: req.bruteForceAttempts.count
        });
      }

      // Find user
      console.log('🔍 SEARCHING FOR USER:', email);
      const user = await User.findOne({ email });
      if (!user) {
        console.log('❌ USER NOT FOUND:', email);
        // Update IP-based brute force attempts
        if (req.bruteForceAttempts) {
          req.bruteForceAttempts.count += 1;
          req.bruteForceAttempts.lastAttempt = Date.now();
          req.app.locals.bruteForceAttempts.set(req.ip, req.bruteForceAttempts);
          console.log(`⚠️ IP BRUTE FORCE: IP ${req.ip} has ${req.bruteForceAttempts.count} failed attempts`);
        }

        // Log failed login attempt
        await AuditLog.create({
          action: 'LOGIN_FAILED',
          resourceType: 'USER',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          details: { email, reason: 'User not found' }
        });

        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // User found - proceed with authentication

      // Check if account is currently locked and handle auto-unlock
      if (user.isLocked && user.lockExpiresAt) {
        const lockoutTime = new Date(user.lockExpiresAt);
        const currentTime = new Date();
        
        // Calculate remaining time in seconds
        const remainingTimeMs = lockoutTime.getTime() - currentTime.getTime();
        const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);
        
        if (remainingTimeMs > 0) {
          // Account is still locked - BLOCK ALL LOGIN ATTEMPTS (even correct password)
          
          return res.status(423).json({
            error: 'ACCOUNT LOCKED - BRUTE FORCE PROTECTION',
            message: `🔒 Account is temporarily locked due to brute force attempts. Try again in ${remainingTimeSeconds} seconds.`,
            remainingAttempts: 0,
            lockedUntil: user.lockExpiresAt.toISOString(),
            retryAfter: remainingTimeSeconds,
            lockReason: user.lockReason,
            lockoutDetails: {
              lockedAt: user.lockExpiresAt.toISOString(),
              currentTime: currentTime.toISOString(),
              remainingSeconds: remainingTimeSeconds,
              totalLockoutDuration: 15 * 60 // 15 minutes in seconds
            }
          });
        } else {
          // Lockout period has expired - unlock account
          
          // Update database to unlock account
          await User.findByIdAndUpdate(user._id, {
            isLocked: false,
            failedLoginAttempts: 0,
            lockExpiresAt: null,
            lockReason: null
          });
          
          // Update local user object
          user.isLocked = false;
          user.failedLoginAttempts = 0;
          user.lockExpiresAt = null;
          user.lockReason = null;
        }
      }

      // Verify password
      const isPasswordValid = await passwordUtils.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        // Update IP-based brute force attempts
        if (req.bruteForceAttempts) {
          req.bruteForceAttempts.count += 1;
          req.bruteForceAttempts.lastAttempt = Date.now();
          req.app.locals.bruteForceAttempts.set(req.ip, req.bruteForceAttempts);
          console.log(`⚠️ IP BRUTE FORCE: IP ${req.ip} has ${req.bruteForceAttempts.count} failed attempts`);
        }

        // Increment failed attempts for this user
        user.failedLoginAttempts += 1;
        
        // Check if account should be locked (exactly at 5 attempts)
        if (user.failedLoginAttempts >= 5) {
          const currentTime = new Date();
          const lockoutExpiryTime = new Date(currentTime.getTime() + (15 * 60 * 1000)); // 15 minutes from now
          
          // Set lockout fields
          user.isLocked = true;
          user.lockExpiresAt = lockoutExpiryTime;
          user.lockReason = 'Brute force protection - 5 failed attempts';
        }
        
        // Save user with lockout status
        try {
          // Use findByIdAndUpdate for reliable saving
          const updateResult = await User.findByIdAndUpdate(
            user._id,
            {
              isLocked: user.isLocked,
              failedLoginAttempts: user.failedLoginAttempts,
              lockExpiresAt: user.lockExpiresAt,
              lockReason: user.lockReason,
              lastFailedLogin: new Date()
            },
            { new: true, runValidators: true }
          );
          
          console.log(`💾 SAVED: User ${updateResult.email} - isLocked: ${updateResult.isLocked}, failedAttempts: ${updateResult.failedLoginAttempts}, lockExpiresAt: ${updateResult.lockExpiresAt}`);
          
          // Update the user object with saved data
          Object.assign(user, updateResult);
          
        } catch (saveError) {
          console.error(`❌ SAVE ERROR: Failed to save user ${user.email}:`, saveError);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to update account status. Please try again.'
          });
        }

        // Log failed login attempt
        await AuditLog.create({
          userId: user._id,
          action: 'LOGIN_FAILED',
          resourceType: 'USER',
          resourceId: user._id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          details: { email, failedAttempts: user.failedLoginAttempts }
        });

        // Return appropriate response based on lockout status
        if (user.isLocked) {
          const remainingTime = Math.ceil((15 * 60 * 1000) / 1000);
          console.log(`🔒 SENDING LOCKOUT RESPONSE: User ${user.email} - remaining time: ${remainingTime} seconds`);
          return res.status(423).json({
            error: 'ACCOUNT LOCKED - BRUTE FORCE PROTECTION',
            message: `🔒 Account locked due to ${user.failedLoginAttempts} failed login attempts. Account is temporarily locked for 15 minutes.`,
            remainingAttempts: 0,
            lockedUntil: user.lockExpiresAt.toISOString(),
            retryAfter: remainingTime,
            lockReason: user.lockReason,
            lockoutDetails: {
              lockedAt: new Date().toISOString(),
              expiresAt: user.lockExpiresAt.toISOString(),
              remainingSeconds: remainingTime,
              totalLockoutDuration: 15 * 60
            }
          });
        } else {
          console.log(`📊 SENDING FAILED LOGIN RESPONSE: User ${user.email} - ${5 - user.failedLoginAttempts} attempts remaining`);
          return res.status(401).json({
            error: 'Invalid credentials',
            message: `Email or password is incorrect. ${5 - user.failedLoginAttempts} attempts remaining before account lockout.`,
            remainingAttempts: Math.max(0, 5 - user.failedLoginAttempts)
          });
        }
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({
          error: 'Account not verified',
          message: 'Please verify your phone number before logging in'
        });
      }

      // Successful login - reset failed attempts and unlock account
      user.failedLoginAttempts = 0;
      user.lockExpiresAt = null;
      user.lockReason = null;
      user.isLocked = false;
      user.lastSuccessfulLogin = new Date();
      await user.save();
      console.log(`✅ SUCCESSFUL LOGIN: User ${user.email} - failedAttempts reset to 0`);

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role,
          sessionId: Math.random().toString(36).substring(2)
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Log successful login
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'USER',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        details: { email, role: user.role }
      });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login. Please try again.'
      });
    }
  },

  // Verify OTP
  verifyOtp: async (req, res) => {
    try {
      const { userId, otp } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Invalid user ID'
        });
      }

      if (user.otp !== otp || user.otpExpires < new Date()) {
        return res.status(400).json({
          error: 'Invalid OTP',
          message: 'OTP is invalid or has expired'
        });
      }

      // Mark user as verified
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      // Log OTP verification
      await AuditLog.create({
        userId: user._id,
        action: 'OTP_VERIFIED',
        resourceType: 'USER',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        details: { email: user.email }
      });

      res.json({
        message: 'Phone number verified successfully'
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        error: 'OTP verification failed',
        message: 'Failed to verify OTP. Please try again.'
      });
    }
  },

  // Setup MFA
  setupMFA: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Generate MFA secret
      const secret = mfaUtils.generateTOTPSecret();
      const qrCode = await mfaUtils.generateQRCode(user.email, secret);
      const backupCodes = mfaUtils.generateBackupCodes();

      // Store MFA setup temporarily
      user.mfa = {
        secret,
        backupCodes,
        enabled: false,
        setupComplete: false
      };

      await user.save();

      res.json({
        message: 'MFA setup initiated',
        qrCode,
        backupCodes,
        secret
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        error: 'MFA setup failed',
        message: 'Failed to setup MFA. Please try again.'
      });
    }
  },

  // Verify MFA
  verifyMFA: async (req, res) => {
    try {
      const { userId, token, backupCode } = req.body;

      const user = await User.findById(userId);
      if (!user || !user.mfa) {
        return res.status(404).json({
          error: 'MFA not configured',
          message: 'MFA is not set up for this account'
        });
      }

      let isValid = false;

      if (backupCode) {
        isValid = mfaUtils.verifyBackupCode(backupCode, user.mfa.backupCodes);
        if (isValid) {
          // Remove used backup code
          user.mfa.backupCodes = user.mfa.backupCodes.filter(code => code !== backupCode);
        }
      } else if (token) {
        isValid = mfaUtils.verifyTOTP(token, user.mfa.secret);
      }

      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid MFA token',
          message: 'Invalid MFA token or backup code'
        });
      }

      // Enable MFA if setup is in progress
      if (!user.mfa.enabled) {
        user.mfa.enabled = true;
        user.mfa.setupComplete = true;
        await user.save();
      }

      res.json({
        message: 'MFA verification successful'
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        error: 'MFA verification failed',
        message: 'Failed to verify MFA. Please try again.'
      });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get profile',
        message: 'An error occurred while fetching profile.'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, phone, allergies, chronicConditions } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Update fields
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (allergies) user.allergies = allergies;
      if (chronicConditions) user.chronicConditions = chronicConditions;

      await user.save();

      // Log profile update
      await AuditLog.create({
        userId: user._id,
        action: 'PROFILE_UPDATE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile.'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await passwordUtils.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Invalid current password',
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      const passwordValidation = passwordUtils.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Weak password',
          message: passwordValidation.error,
          details: passwordValidation.details
        });
      }

      // Check password history
      const historyCheck = passwordUtils.checkPasswordHistory(newPassword, user.passwordHistory);
      if (historyCheck.isReused) {
        return res.status(400).json({
          error: 'Password reuse not allowed',
          message: historyCheck.error
        });
      }

      // Hash new password
      const hashedNewPassword = await passwordUtils.hashPassword(newPassword);

      // Update password and history
      user.password = hashedNewPassword;
      user.passwordChangedAt = new Date();
      user.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      // Add to password history
      user.passwordHistory.push({
        password: hashedNewPassword,
        changedAt: new Date()
      });

      // Keep only last 5 passwords
      if (user.passwordHistory.length > 5) {
        user.passwordHistory = user.passwordHistory.slice(-5);
      }

      await user.save();

      // Log password change
      await AuditLog.create({
        userId: user._id,
        action: 'PASSWORD_CHANGE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { passwordChangedAt: user.passwordChangedAt }
      });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: 'An error occurred while changing password.'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const userId = req.user.id;

      // Log logout
      await AuditLog.create({
        userId,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout.'
      });
    }
  }
};

module.exports = authController;
