// Comprehensive security audit logging for compliance and threat detection
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE',
      'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_VERIFY_SUCCESS',
      'MFA_VERIFY_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'OTP_VERIFIED',
      
      // Profile actions
      'PROFILE_UPDATE', 'PROFILE_VIEW',
      
      // Appointment actions
      'APPOINTMENT_CREATED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED',
      'APPOINTMENT_VIEWED',
      
      // Medical record actions
      'MEDICAL_RECORD_CREATED', 'MEDICAL_RECORD_UPDATED', 'MEDICAL_RECORD_VIEWED',
      'MEDICAL_RECORD_DELETED',
      
      // Doctor actions
      'DOCTOR_VIEWED', 'DOCTOR_SEARCHED',
      
      // Payment actions
      'PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED',
      
      // Admin actions
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'SYSTEM_CONFIG_CHANGED',
      
      // Security actions
      'SUSPICIOUS_ACTIVITY', 'BRUTE_FORCE_ATTEMPT', 'RATE_LIMIT_EXCEEDED',
      'INVALID_TOKEN', 'SESSION_EXPIRED', 'ACCESS_DENIED'
    ]
  },
  
  // Resource information
  resourceType: {
    type: String,
    enum: ['USER', 'APPOINTMENT', 'MEDICAL_RECORD', 'DOCTOR', 'PAYMENT', 'SYSTEM'],
    required: true
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Optional for system-wide actions
  },
  
  // Request details
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  requestMethod: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  
  requestUrl: {
    type: String,
    required: true
  },
  
  // Additional context
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Security flags
  isSuspicious: {
    type: Boolean,
    default: false
  },
  
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  
  // Geolocation (if available)
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Session information
  sessionId: {
    type: String,
    required: false
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ isSuspicious: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });

// TTL index to automatically delete old logs (keep for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model("AuditLog", auditLogSchema); 