const xss = require('xss');
const { body, validationResult } = require('express-validator');

const securityMiddleware = {
  // XSS Protection
  xssProtection: (req, res, next) => {
    if (req.body) {
      // Sanitize request body
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = xss(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      // Sanitize query parameters
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            sanitized[key] = xss(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.query = sanitizeObject(req.query);
    }
    
    next();
  },

  // NoSQL Injection Prevention
  nosqlInjection: (req, res, next) => {
    const checkForNoSQLInjection = (obj) => {
      const dangerousPatterns = [
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$gte/i,
        /\$lte/i,
        /\$in/i,
        /\$nin/i,
        /\$regex/i,
        /\$options/i,
        /\$exists/i,
        /\$type/i,
        /\$mod/i,
        /\$all/i,
        /\$elemMatch/i,
        /\$size/i,
        /\$or/i,
        /\$and/i,
        /\$not/i,
        /\$nor/i,
        /\$text/i,
        /\$search/i,
        /\$language/i,
        /\$caseSensitive/i,
        /\$diacriticSensitive/i,
        /\$project/i,
        /\$sort/i,
        /\$limit/i,
        /\$skip/i,
        /\$group/i,
        /\$unwind/i,
        /\$lookup/i,
        /\$match/i,
        /\$addFields/i,
        /\$replaceRoot/i,
        /\$replaceWith/i,
        /\$set/i,
        /\$unset/i,
        /\$inc/i,
        /\$mul/i,
        /\$rename/i,
        /\$min/i,
        /\$max/i,
        /\$currentDate/i,
        /\$timestamp/i,
        /\$push/i,
        /\$pull/i,
        /\$pullAll/i,
        /\$addToSet/i,
        /\$pop/i,
        /\$bit/i,
        /\$isolated/i,
        /\$comment/i,
        /\$explain/i,
        /\$hint/i,
        /\$maxScan/i,
        /\$maxTimeMS/i,
        /\$max/i,
        /\$min/i,
        /\$orderby/i,
        /\$query/i,
        /\$returnKey/i,
        /\$showDiskLoc/i,
        /\$natural/i,
        /\$indexBounds/i,
        /\$allPlansExecution/i,
        /\$executionStats/i,
        /\$writeConcern/i,
        /\$readPreference/i,
        /\$readConcern/i,
        /\$collation/i
      ];

      // Enhanced check for JSON-like strings containing MongoDB operators
      const checkStringForNoSQLInjection = (str) => {
        if (typeof str !== 'string') return false;
        
        // Check for JSON-like strings that might contain MongoDB operators
        if (str.includes('{') && str.includes('}')) {
          // Check for MongoDB operators in JSON-like strings
          if (dangerousPatterns.some(pattern => pattern.test(str))) {
            return true;
          }
          
          // Check for common NoSQL injection patterns
          const jsonPatterns = [
            /"\$ne"/i,
            /"\$where"/i,
            /"\$gt"/i,
            /"\$lt"/i,
            /"\$regex"/i,
            /"\$or"/i,
            /"\$and"/i,
            /"\$not"/i,
            /"\$nor"/i,
            /"\$in"/i,
            /"\$nin"/i,
            /"\$exists"/i,
            /"\$type"/i,
            /"\$mod"/i,
            /"\$all"/i,
            /"\$elemMatch"/i,
            /"\$size"/i
          ];
          
          if (jsonPatterns.some(pattern => pattern.test(str))) {
            return true;
          }
        }
        
        // Check for MongoDB operators in plain strings
        return dangerousPatterns.some(pattern => pattern.test(str));
      };

      for (const [key, value] of Object.entries(obj)) {
        // Check key for dangerous patterns
        if (dangerousPatterns.some(pattern => pattern.test(key))) {
          return true;
        }
        
        // Enhanced check for string values
        if (typeof value === 'string' && checkStringForNoSQLInjection(value)) {
          return true;
        }
        
        // Recursively check nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (checkForNoSQLInjection(value)) {
            return true;
          }
        }
      }
      
      return false;
    };

    // Check request body
    if (req.body && checkForNoSQLInjection(req.body)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request contains potentially dangerous content - NoSQL injection detected'
      });
    }

    // Check query parameters
    if (req.query && checkForNoSQLInjection(req.query)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query parameters contain potentially dangerous content - NoSQL injection detected'
      });
    }

    next();
  },

  // Input Validation
  inputValidation: (req, res, next) => {
    // Common validation rules
    const commonValidations = [
      body('email').isEmail().normalizeEmail(),
      body('name').trim().isLength({ min: 2, max: 50 }).escape(),
      body('phone').optional().isMobilePhone(),
      body('password').isLength({ min: 8, max: 128 }),
      body('role').optional().isIn(['patient', 'doctor', 'admin']),
      body('specialty').optional().trim().isLength({ min: 2, max: 50 }).escape(),
      body('hospital').optional().trim().isLength({ min: 2, max: 100 }).escape(),
      body('city').optional().trim().isLength({ min: 2, max: 50 }).escape(),
      body('consultationFee').optional().isNumeric().isFloat({ min: 0 }),
      body('experience').optional().isInt({ min: 0, max: 50 }),
      body('rating').optional().isFloat({ min: 0, max: 5 }),
      body('appointmentDate').optional().isISO8601(),
      body('timeSlot').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      body('consultationType').optional().isIn(['in-person', 'video', 'phone']),
      body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
      body('symptoms').optional().trim().isLength({ max: 1000 }).escape(),
      body('notes').optional().trim().isLength({ max: 2000 }).escape(),
      body('prescription').optional().trim().isLength({ max: 2000 }).escape(),
      body('diagnosis').optional().trim().isLength({ max: 1000 }).escape(),
      body('vitalSigns').optional().isObject(),
      body('labTests').optional().isArray(),
      body('followUp').optional().isISO8601(),
      body('isConfidential').optional().isBoolean(),
      body('message').optional().trim().isLength({ min: 10, max: 1000 }).escape(),
      body('subject').optional().trim().isLength({ min: 5, max: 100 }).escape()
    ];

    // Apply validations based on route
    const validations = [];
    
    if (req.path.includes('/auth/register') || req.path.includes('/auth/login')) {
      validations.push(
        body('email').isEmail().normalizeEmail()
      );
      
      // Only apply password length validation for registration, not login
      if (req.path.includes('/auth/register')) {
        validations.push(
          body('password').isLength({ min: 8, max: 128 })
        );
      } else {
        // For login, just ensure password exists
        validations.push(
          body('password').notEmpty().withMessage('Password is required')
        );
      }
    }
    
    if (req.path.includes('/doctors')) {
      validations.push(
        body('name').trim().isLength({ min: 2, max: 50 }).escape(),
        body('specialty').trim().isLength({ min: 2, max: 50 }).escape(),
        body('qualification').optional().trim().isLength({ min: 2, max: 200 }).escape(),
        body('experience').optional().isInt({ min: 0, max: 50 }),
        body('consultationFee').optional().isNumeric().isFloat({ min: 0 }),
        body('hospital').optional().trim().isLength({ min: 2, max: 100 }).escape(),
        body('city').optional().trim().isLength({ min: 2, max: 50 }).escape()
      );
    }
    
    if (req.path.includes('/appointments')) {
      validations.push(
        body('appointmentDate').isISO8601(),
        body('timeSlot').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        body('consultationType').isIn(['in-person', 'video', 'phone']),
        body('symptoms').optional().trim().isLength({ max: 1000 }).escape()
      );
    }
    
    if (req.path.includes('/medical-records')) {
      validations.push(
        body('symptoms').optional().trim().isLength({ max: 1000 }).escape(),
        body('diagnosis').optional().trim().isLength({ max: 1000 }).escape(),
        body('prescription').optional().trim().isLength({ max: 2000 }).escape(),
        body('notes').optional().trim().isLength({ max: 2000 }).escape()
      );
    }
    
    if (req.path.includes('/contact')) {
      validations.push(
        body('name').trim().isLength({ min: 2, max: 50 }).escape(),
        body('email').isEmail().normalizeEmail(),
        body('subject').trim().isLength({ min: 5, max: 100 }).escape(),
        body('message').trim().isLength({ min: 10, max: 1000 }).escape()
      );
    }

    // Apply validations
    Promise.all(validations.map(validation => validation.run(req)))
      .then(() => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
          });
        }
        next();
      })
      .catch(next);
  },

  // CSRF Protection (Enhanced implementation)
  csrfProtection: (req, res, next) => {
    // Skip CSRF for API routes that don't modify data
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Skip CSRF for webhook endpoints (they need to be accessible externally)
    if (req.path.includes('/webhooks')) {
      return next();
    }

    // Check for CSRF token in headers
    const csrfToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.headers['csrf-token'];
    
    if (!csrfToken) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF protection is enabled. Please include a valid CSRF token in the request headers.',
        required: 'Include X-CSRF-Token or X-XSRF-Token header'
      });
    }

    // Basic token validation (in production, validate against session)
    if (typeof csrfToken !== 'string' || csrfToken.length < 10) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token format is invalid.',
        required: 'Token must be a valid string with minimum length'
      });
    }

    // Check for common CSRF token patterns
    const validTokenPattern = /^[a-zA-Z0-9\-_]{10,}$/;
    if (!validTokenPattern.test(csrfToken)) {
      return res.status(403).json({
        error: 'Invalid CSRF token format',
        message: 'CSRF token contains invalid characters.',
        required: 'Token must contain only alphanumeric characters, hyphens, and underscores'
      });
    }

    // Log CSRF validation for audit
    console.log(`CSRF validation passed for ${req.method} ${req.path} from ${req.ip}`);

    next();
  },

  // File Upload Security
  fileUploadSecurity: (req, res, next) => {
    // Check file size
    if (req.file && req.file.size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 5MB'
      });
    }

    // Check file type
    if (req.file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
        });
      }
    }

    next();
  }
};

module.exports = securityMiddleware; 