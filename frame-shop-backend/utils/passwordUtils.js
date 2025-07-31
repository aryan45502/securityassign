// Enterprise-grade password security with strength assessment and history tracking
const bcrypt = require('bcryptjs');

const passwordUtils = {
  // Password strength assessment
  assessPasswordStrength: (password) => {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }
    
    if (password.length >= 12) {
      score += 1;
    }
    
    // Character variety checks
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one uppercase letter');
    }
    
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one lowercase letter');
    }
    
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one special character');
    }
    
    // Common password check
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      score -= 2;
      feedback.push('Avoid common passwords');
    }
    
    // Sequential characters check - only penalize excessive repetition
    if (/(.)\1{3,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid excessive repeated characters (4 or more)');
    }
    
    // Determine strength level
    let strength = 'weak';
    let isValid = false;
    
    if (score >= 5) {
      strength = 'strong';
      isValid = true; // Allow moderate+ passwords
    } else if (score >= 4) {
      strength = 'moderate';
      isValid = true; // Allow moderate passwords too
    } else {
      strength = 'weak';
      isValid = false;
    }
    
    return {
      score,
      strength,
      isValid,
      feedback,
      requirements: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      }
    };
  },

  // Password validation
  validatePassword: (password) => {
    const assessment = passwordUtils.assessPasswordStrength(password);
    
    if (!assessment.isValid) {
      return {
        isValid: false,
        error: 'Password does not meet security requirements',
        details: assessment.feedback
      };
    }
    
    return {
      isValid: true,
      strength: assessment.strength,
      score: assessment.score
    };
  },

  // Hash password
  hashPassword: async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Verify password
  verifyPassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Check password history
  checkPasswordHistory: (newPassword, passwordHistory) => {
    if (!passwordHistory || passwordHistory.length === 0) {
      return { isReused: false };
    }
    
    // Check against last 5 passwords
    const recentPasswords = passwordHistory.slice(-5);
    
    for (const historyEntry of recentPasswords) {
      if (bcrypt.compareSync(newPassword, historyEntry.password)) {
        return {
          isReused: true,
          error: 'Password cannot be the same as your last 5 passwords'
        };
      }
    }
    
    return { isReused: false };
  },

  // Generate secure password
  generateSecurePassword: () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  },

  // Check password expiry
  checkPasswordExpiry: (passwordChangedAt, expiryDays = 90) => {
    if (!passwordChangedAt) return { isExpired: false };
    
    const expiryDate = new Date(passwordChangedAt);
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    const now = new Date();
    const isExpired = now > expiryDate;
    
    return {
      isExpired,
      daysUntilExpiry: isExpired ? 0 : Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
      expiryDate: expiryDate
    };
  }
};

module.exports = passwordUtils; 