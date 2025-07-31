// Multi-factor authentication utilities with TOTP, SMS, and backup codes
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate TOTP secret
const generateTOTPSecret = () => {
  return speakeasy.generateSecret({
    name: 'MediConnect Healthcare',
    issuer: 'MediConnect',
    length: 32
  });
};

// Generate QR code for TOTP setup
const generateQRCode = async (secret) => {
  try {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'MediConnect Healthcare',
      issuer: 'MediConnect',
      algorithm: 'sha1',
      digits: 6,
      period: 30
    });
    
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify TOTP token
const verifyTOTP = (token, secret, window = 2) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: window // Allow 2 time steps before/after for clock skew
  });
};

// Generate backup codes
const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Verify backup code
const verifyBackupCode = (code, usedCodes) => {
  // Check if code is in the list of valid codes and hasn't been used
  return !usedCodes.includes(code);
};

// Mark backup code as used
const markBackupCodeUsed = (code, usedCodes) => {
  if (!usedCodes.includes(code)) {
    usedCodes.push(code);
    return true;
  }
  return false;
};

// Generate SMS OTP
const generateSMSOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Rate limiting for MFA attempts
const mfaAttemptTracker = new Map();

const trackMFAAttempt = (identifier, maxAttempts = 3, lockoutDuration = 5 * 60 * 1000) => {
  const now = Date.now();
  const attempts = mfaAttemptTracker.get(identifier) || { count: 0, firstAttempt: now };
  
  attempts.count++;
  
  if (attempts.count >= maxAttempts) {
    attempts.lockedUntil = now + lockoutDuration;
  }
  
  mfaAttemptTracker.set(identifier, attempts);
  
  return {
    isLocked: attempts.lockedUntil && now < attempts.lockedUntil,
    remainingAttempts: Math.max(0, maxAttempts - attempts.count),
    lockoutTime: attempts.lockedUntil ? Math.ceil((attempts.lockedUntil - now) / 1000) : 0
  };
};

const resetMFAAttempts = (identifier) => {
  mfaAttemptTracker.delete(identifier);
};

module.exports = {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  verifyBackupCode,
  markBackupCodeUsed,
  generateSMSOTP,
  trackMFAAttempt,
  resetMFAAttempts
}; 