// Enhanced User model with comprehensive security features
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128
  },
  
  // Password Security
  passwordHistory: [{
    password: String,
    changedAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: { type: Date },
  passwordExpiresAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Multi-Factor Authentication
  mfa: {
    enabled: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ['totp', 'sms', 'email'],
      default: 'totp'
    },
    totpSecret: String,
    backupCodes: [String],
    usedBackupCodes: [String],
    lastMFAAttempt: Date
  },
  
  // Account Security
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockReason: String,
  lockExpiresAt: Date,
  
  // Login Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: Date,
  lastSuccessfulLogin: Date,
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    success: Boolean,
    location: {
      country: String,
      region: String,
      city: String
    }
  }],
  
  // Session Management
  activeSessions: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  
  // OTP Verification
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  
  // Medical Information (for patients)
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  bloodType: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  
  // Medical History
  allergies: [String],
  chronicConditions: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: "Nepal" }
  },
  
  // Doctor-specific fields
  doctorProfile: {
    licenseNumber: String,
    specialty: String,
    qualification: String,
    experience: Number,
    hospital: String,
    consultationFee: Number,
    isActive: { type: Boolean, default: true }
  },
  
  // Security Preferences
  securityPreferences: {
    requireMFA: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 10 }, // minutes
    maxConcurrentSessions: { type: Number, default: 5 },
    notifyOnLogin: { type: Boolean, default: true },
    notifyOnPasswordChange: { type: Boolean, default: true }
  },
  
  // Privacy Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    allowDataSharing: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false }
  }
}, { 
  timestamps: true 
});

// Indexes for performance and security
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isLocked: 1 });
userSchema.index({ 'loginHistory.timestamp': -1 });
userSchema.index({ 'activeSessions.lastActivity': 1 });

// Virtual for password age
userSchema.virtual('passwordAge').get(function() {
  if (!this.passwordChangedAt) return null;
  return Date.now() - this.passwordChangedAt.getTime();
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Pre-save middleware to hash password
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   
//   try {
//     // Hash password with increased salt rounds
//     this.password = await bcrypt.hash(this.password, 12);
//     
//     // Add to password history (keep last 5)
//     if (this.passwordHistory.length >= 5) {
//       this.passwordHistory.shift();
//     }
//     this.passwordHistory.push({
//       password: this.password,
//       changedAt: new Date()
//     });
//     
//     this.passwordChangedAt = new Date();
//     
//     // Set password expiry (90 days)
//     this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
//     
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password is expired
userSchema.methods.isPasswordExpired = function() {
  if (!this.passwordExpiresAt) return false;
  return Date.now() > this.passwordExpiresAt.getTime();
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.isLocked) return false;
  if (!this.lockExpiresAt) return true; // Permanent lock
  return Date.now() < this.lockExpiresAt.getTime();
};

// Method to lock account
userSchema.methods.lockAccount = function(reason, duration = null) {
  this.isLocked = true;
  this.lockReason = reason;
  this.lockExpiresAt = duration ? new Date(Date.now() + duration) : null;
};

// Method to unlock account
userSchema.methods.unlockAccount = function() {
  this.isLocked = false;
  this.lockReason = null;
  this.lockExpiresAt = null;
  this.failedLoginAttempts = 0;
};

// Method to add login attempt
userSchema.methods.addLoginAttempt = function(success, ipAddress, userAgent, location = null) {
  const loginRecord = {
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
    location
  };
  
  this.loginHistory.push(loginRecord);
  
  // Keep only last 50 login attempts
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  if (success) {
    this.lastSuccessfulLogin = new Date();
    this.failedLoginAttempts = 0;
  } else {
    this.lastFailedLogin = new Date();
    this.failedLoginAttempts += 1;
  }
};

// Method to add active session
userSchema.methods.addSession = function(sessionId, ipAddress, userAgent, duration = 30 * 60 * 1000) {
  // Remove expired sessions
  this.activeSessions = this.activeSessions.filter(session => 
    session.expiresAt && Date.now() < session.expiresAt.getTime()
  );
  
  // Check max concurrent sessions
  if (this.activeSessions.length >= this.securityPreferences.maxConcurrentSessions) {
    // Remove oldest session
    this.activeSessions.shift();
  }
  
  this.activeSessions.push({
    sessionId,
    ipAddress,
    userAgent,
    createdAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + duration)
  });
};

// Method to remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(session => 
    session.sessionId !== sessionId
  );
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
};

// Method to check if MFA is required
userSchema.methods.requiresMFA = function() {
  return this.mfa.enabled || this.securityPreferences.requireMFA;
};

// Method to generate backup codes
userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  this.mfa.backupCodes = codes;
  this.mfa.usedBackupCodes = [];
  return codes;
};

// Method to verify backup code
userSchema.methods.verifyBackupCode = function(code) {
  const index = this.mfa.backupCodes.indexOf(code);
  if (index !== -1 && !this.mfa.usedBackupCodes.includes(code)) {
    this.mfa.backupCodes.splice(index, 1);
    this.mfa.usedBackupCodes.push(code);
    return true;
  }
  return false;
};

// Method to get user's security status
userSchema.methods.getSecurityStatus = function() {
  return {
    mfaEnabled: this.mfa.enabled,
    passwordExpired: this.isPasswordExpired(),
    accountLocked: this.isAccountLocked(),
    failedAttempts: this.failedLoginAttempts,
    activeSessions: this.activeSessions.length,
    lastLogin: this.lastSuccessfulLogin,
    passwordAge: this.passwordAge
  };
};

module.exports = mongoose.model("User", userSchema);