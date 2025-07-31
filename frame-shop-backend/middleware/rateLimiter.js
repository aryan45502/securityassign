const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const rateLimiter = {
  // Track IP reputation
  trackIPReputation: (req, res, next) => {
    // Simple IP tracking for reputation
    const ip = req.ip;
    if (!req.app.locals.ipReputation) {
      req.app.locals.ipReputation = new Map();
    }
    
    const reputation = req.app.locals.ipReputation.get(ip) || { score: 100, violations: 0 };
    req.ipReputation = reputation;
    
    next();
  },

  // Brute force detection
  bruteForceDetector: (req, res, next) => {
    const ip = req.ip;
    if (!req.app.locals.bruteForceAttempts) {
      req.app.locals.bruteForceAttempts = new Map();
    }
    
    const attempts = req.app.locals.bruteForceAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    // Reset if more than 15 minutes have passed
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
    }
    
    req.bruteForceAttempts = attempts;
    next();
  },

  // General API rate limiter
  apiRateLimiter: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // limit each IP to 5 requests per windowMs (reduced for easier testing)
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      console.log('🚫 RATE LIMIT TRIGGERED:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      // Update IP reputation
      if (req.ipReputation) {
        req.ipReputation.score = Math.max(0, req.ipReputation.score - 10);
        req.ipReputation.violations += 1;
      }
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      });
    }
  }),

  // Auth-specific rate limiter
  authRateLimiter: rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 5 * 60 * 1000, // 5 minutes (reduced for testing)
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10, // limit each IP to 10 auth requests per windowMs (increased for testing)
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 5 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      // Update IP reputation
      if (req.ipReputation) {
        req.ipReputation.score = Math.max(0, req.ipReputation.score - 20);
        req.ipReputation.violations += 1;
      }
      
      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 5 * 60 * 1000) / 1000)
      });
    }
  }),

  // Login-specific rate limiter
  loginRateLimiter: rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 3, // limit each IP to 3 login attempts per windowMs
    message: {
      error: 'Too many login attempts',
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      // Update brute force attempts
      if (req.bruteForceAttempts) {
        req.bruteForceAttempts.count += 1;
        req.bruteForceAttempts.lastAttempt = Date.now();
      }
      
      // Update IP reputation
      if (req.ipReputation) {
        req.ipReputation.score = Math.max(0, req.ipReputation.score - 30);
        req.ipReputation.violations += 1;
      }
      
      res.status(429).json({
        error: 'Too many login attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
      });
    }
  }),

  // MFA rate limiter
  mfaRateLimiter: rateLimit({
    windowMs: parseInt(process.env.MFA_RATE_LIMIT_WINDOW) || 5 * 60 * 1000, // 5 minutes
    max: parseInt(process.env.MFA_RATE_LIMIT_MAX) || 3, // limit each IP to 3 MFA attempts per windowMs
    message: {
      error: 'Too many MFA attempts',
      message: 'Too many MFA attempts. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.MFA_RATE_LIMIT_WINDOW) || 5 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many MFA attempts',
        message: 'Too many MFA attempts. Please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.MFA_RATE_LIMIT_WINDOW) || 5 * 60 * 1000) / 1000)
      });
    }
  }),

  // Registration rate limiter
  registrationRateLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: {
      error: 'Too many registration attempts',
      message: 'Too many registration attempts. Please try again later.',
      retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many registration attempts',
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: 3600
      });
    }
  }),

  // Password reset rate limiter
  passwordResetRateLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
      error: 'Too many password reset attempts',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many password reset attempts',
        message: 'Too many password reset attempts. Please try again later.',
        retryAfter: 3600
      });
    }
  })
};

module.exports = rateLimiter; 