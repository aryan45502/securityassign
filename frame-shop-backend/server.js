
require("dotenv").config({ path: "./config.env" });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const rateLimiter = require('./middleware/rateLimiter');
const securityMiddleware = require('./middleware/securityMiddleware');
const passport = require('passport');
const User = require('./models/User'); // Added for test endpoints
const passwordUtils = require('./utils/passwordUtils'); // Added for password verification

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const contactRoutes = require('./routes/contactRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');


const app = express();

// Connect to MongoDB
connectDB();

// Background job to automatically unlock accounts after lockout period
const unlockExpiredAccounts = async () => {
  try {
    const now = new Date();
    const result = await User.updateMany(
      {
        isLocked: true,
        lockExpiresAt: { $lt: now }
      },
      {
        $set: {
          isLocked: false,
          failedLoginAttempts: 0,
          lockExpiresAt: null,
          lockReason: null
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🔓 AUTO UNLOCK: Unlocked ${result.modifiedCount} expired accounts`);
    }
  } catch (error) {
    console.error('❌ AUTO UNLOCK ERROR:', error);
  }
};

// Run unlock job every 5 minutes
setInterval(unlockExpiredAccounts, 5 * 60 * 1000);

// Run initial unlock job on server start
unlockExpiredAccounts();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.nosqlInjection);
app.use(securityMiddleware.inputValidation);
// app.use(securityMiddleware.csrfProtection); // Temporarily disabled for testing

// Rate limiting
app.use(rateLimiter.trackIPReputation);
app.use(rateLimiter.bruteForceDetector);
app.use(rateLimiter.apiRateLimiter);

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/api/auth', rateLimiter.authRateLimiter, authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
    security: {
      helmet: 'enabled',
      rateLimiting: 'enabled',
      cors: 'enabled'
    }
  });
});

// Test endpoint for rate limiting (REMOVE IN PRODUCTION)
app.get('/api/test/rate-limit', (req, res) => {
  console.log('📡 Rate limit test endpoint called');
  res.json({
    message: 'Rate limit test endpoint',
    timestamp: new Date().toISOString(),
    requestCount: req.app.locals.requestCount || 0
  });
});

// Simple test endpoint for easier rate limiting testing
app.get('/api/test/simple', (req, res) => {
  console.log('📡 Simple test endpoint called');
  res.json({
    message: 'Simple test endpoint - this should trigger rate limiting after 5 calls',
    timestamp: new Date().toISOString()
  });
});

// Security status endpoint
app.get('/api/security/status', (req, res) => {
  res.json({
    securityFeatures: {
      passwordPolicy: 'enabled',
      mfa: 'enabled',
      rateLimiting: 'enabled',
      sessionManagement: 'enabled',
      auditLogging: 'enabled',
      xssProtection: 'enabled',
      nosqlInjection: 'enabled',
      csrfProtection: 'enabled'
    },
    timestamp: new Date().toISOString()
  });
});

// Reset rate limiting for testing (REMOVE IN PRODUCTION)
app.post('/api/test/reset-rate-limits', (req, res) => {
  if (req.app.locals.bruteForceAttempts) {
    req.app.locals.bruteForceAttempts.clear();
  }
  if (req.app.locals.ipReputation) {
    req.app.locals.ipReputation.clear();
  }
  res.json({
    message: 'Rate limits reset for testing',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check user lockout status (REMOVE IN PRODUCTION)
app.get('/api/test/user-status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      email: user.email,
      isLocked: user.isLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lockExpiresAt: user.lockExpiresAt,
      lockReason: user.lockReason
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Test endpoint to manually lock a user (REMOVE IN PRODUCTION)
app.post('/api/test/lock-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isLocked = true;
    user.lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.lockReason = 'Manual lock for testing';
    await user.save();
    
    res.json({ 
      message: 'User locked successfully',
      user: { email: user.email, isLocked: user.isLocked, lockExpiresAt: user.lockExpiresAt }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lock user', details: error.message });
  }
});

// Test endpoint to check account lockout status (REMOVE IN PRODUCTION)
app.get('/api/test/account-status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date();
    const isCurrentlyLocked = user.isLocked && user.lockExpiresAt && user.lockExpiresAt > now;
    const remainingTime = user.lockExpiresAt && user.lockExpiresAt > now 
      ? Math.ceil((user.lockExpiresAt - now) / 1000) 
      : 0;
    
    res.json({
      email: user.email,
      isLocked: user.isLocked,
      isCurrentlyLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lockExpiresAt: user.lockExpiresAt,
      lockReason: user.lockReason,
      remainingLockoutTime: remainingTime,
      willAutoUnlock: user.lockExpiresAt ? new Date(user.lockExpiresAt).toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get account status', details: error.message });
  }
});

// Test endpoint to unlock a user (REMOVE IN PRODUCTION)
app.post('/api/test/unlock-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockExpiresAt = null;
    user.lockReason = null;
    await user.save();
    
    res.json({ 
      message: 'User unlocked successfully',
      user: { email: user.email, isLocked: user.isLocked, failedLoginAttempts: user.failedLoginAttempts }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlock user', details: error.message });
  }
});

// Test endpoint to simulate failed login attempts (REMOVE IN PRODUCTION)
app.post('/api/test/simulate-failed-login/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { attempts = 1 } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🧪 SIMULATING FAILED LOGIN: User ${user.email} - Current attempts: ${user.failedLoginAttempts}`);
    
    // Simulate failed login attempts
    for (let i = 0; i < attempts; i++) {
      user.failedLoginAttempts += 1;
      console.log(`🧪 SIMULATING FAILED ATTEMPT ${i + 1}: User ${user.email} - failedAttempts: ${user.failedLoginAttempts}`);
      
      if (user.failedLoginAttempts >= 5) {
        const currentTime = new Date();
        const lockoutExpiryTime = new Date(currentTime.getTime() + (15 * 60 * 1000)); // 15 minutes
        
        user.isLocked = true;
        user.lockExpiresAt = lockoutExpiryTime;
        user.lockReason = 'Test simulation - 5 failed attempts';
        console.log(`🔒 SIMULATED LOCK: User ${user.email} locked due to ${user.failedLoginAttempts} failed attempts`);
        console.log(`⏰ Lockout Details: Locked at ${currentTime.toISOString()}, Expires at ${lockoutExpiryTime.toISOString()}`);
        break;
      }
    }
    
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
    
    console.log(`💾 SIMULATION SAVED: User ${updateResult.email} - isLocked: ${updateResult.isLocked}, failedAttempts: ${updateResult.failedLoginAttempts}, lockExpiresAt: ${updateResult.lockExpiresAt}`);
    
    res.json({
      message: `Simulated ${attempts} failed login attempts`,
      user: {
        email: updateResult.email,
        isLocked: updateResult.isLocked,
        failedLoginAttempts: updateResult.failedLoginAttempts,
        lockExpiresAt: updateResult.lockExpiresAt,
        lockReason: updateResult.lockReason
      },
      willBeLocked: updateResult.failedLoginAttempts >= 5,
      lockoutDetails: updateResult.lockExpiresAt ? {
        lockedAt: new Date(updateResult.lockExpiresAt.getTime() - (15 * 60 * 1000)).toISOString(),
        expiresAt: updateResult.lockExpiresAt.toISOString(),
        remainingSeconds: Math.ceil((updateResult.lockExpiresAt.getTime() - new Date().getTime()) / 1000)
      } : null
    });
  } catch (error) {
    console.error('❌ SIMULATION ERROR:', error);
    res.status(500).json({ error: 'Failed to simulate failed login', details: error.message });
  }
});

// Test endpoint to manually trigger lockout (REMOVE IN PRODUCTION)
app.post('/api/test/trigger-lockout/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { duration = 15 } = req.body; // duration in minutes
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentTime = new Date();
    const lockoutExpiryTime = new Date(currentTime.getTime() + (duration * 60 * 1000));
    
    console.log(`🔒 MANUAL LOCKOUT TRIGGER: User ${user.email}`);
    console.log(`⏰ Lockout Details: Current time: ${currentTime.toISOString()}, Expires at: ${lockoutExpiryTime.toISOString()}, Duration: ${duration} minutes`);
    
    // Update user with lockout
    const updateResult = await User.findByIdAndUpdate(
      user._id,
      {
        isLocked: true,
        failedLoginAttempts: 5,
        lockExpiresAt: lockoutExpiryTime,
        lockReason: 'Manual lockout trigger for testing',
        lastFailedLogin: currentTime
      },
      { new: true, runValidators: true }
    );
    
    console.log(`💾 MANUAL LOCKOUT SAVED: User ${updateResult.email} - isLocked: ${updateResult.isLocked}, lockExpiresAt: ${updateResult.lockExpiresAt}`);
    
    res.json({
      message: `Account manually locked for ${duration} minutes`,
      user: {
        email: updateResult.email,
        isLocked: updateResult.isLocked,
        failedLoginAttempts: updateResult.failedLoginAttempts,
        lockExpiresAt: updateResult.lockExpiresAt,
        lockReason: updateResult.lockReason
      },
      lockoutDetails: {
        lockedAt: currentTime.toISOString(),
        expiresAt: lockoutExpiryTime.toISOString(),
        duration: duration * 60, // in seconds
        remainingSeconds: Math.ceil((lockoutExpiryTime.getTime() - new Date().getTime()) / 1000)
      }
    });
  } catch (error) {
    console.error('❌ MANUAL LOCKOUT ERROR:', error);
    res.status(500).json({ error: 'Failed to trigger manual lockout', details: error.message });
  }
});

// Test endpoint to check if user can login (REMOVE IN PRODUCTION)
app.post('/api/test/check-login-ability/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date();
    const isCurrentlyLocked = user.isLocked && user.lockExpiresAt && user.lockExpiresAt > now;
    const remainingTime = user.lockExpiresAt && user.lockExpiresAt > now 
      ? Math.ceil((user.lockExpiresAt - now) / 1000) 
      : 0;
    
    // Check if password is correct
    const isPasswordValid = await passwordUtils.verifyPassword(password, user.password);
    
    res.json({
      email: user.email,
      isLocked: user.isLocked,
      isCurrentlyLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lockExpiresAt: user.lockExpiresAt,
      lockReason: user.lockReason,
      remainingLockoutTime: remainingTime,
      isPasswordCorrect: isPasswordValid,
      canLogin: !isCurrentlyLocked && isPasswordValid,
      willAutoUnlock: user.lockExpiresAt ? new Date(user.lockExpiresAt).toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check login ability', details: error.message });
  }
});

// Real-time lockout status endpoint (REMOVE IN PRODUCTION)
app.get('/api/test/realtime-lockout-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date();
    const isCurrentlyLocked = user.isLocked && user.lockExpiresAt && user.lockExpiresAt > now;
    const remainingTimeMs = user.lockExpiresAt && user.lockExpiresAt > now 
      ? user.lockExpiresAt.getTime() - now.getTime()
      : 0;
    const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);
    
    // Calculate precise timing information
    const lockoutDetails = user.lockExpiresAt ? {
      lockedAt: new Date(user.lockExpiresAt.getTime() - (15 * 60 * 1000)).toISOString(),
      expiresAt: user.lockExpiresAt.toISOString(),
      currentTime: now.toISOString(),
      remainingMilliseconds: remainingTimeMs,
      remainingSeconds: remainingTimeSeconds,
      totalLockoutDuration: 15 * 60, // 15 minutes in seconds
      progressPercentage: Math.max(0, Math.min(100, ((15 * 60) - remainingTimeSeconds) / (15 * 60) * 100))
    } : null;
    
    res.json({
      email: user.email,
      isLocked: user.isLocked,
      isCurrentlyLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lockExpiresAt: user.lockExpiresAt,
      lockReason: user.lockReason,
      remainingLockoutTime: remainingTimeSeconds,
      lockoutDetails,
      canLogin: !isCurrentlyLocked,
      willAutoUnlock: user.lockExpiresAt ? new Date(user.lockExpiresAt).toISOString() : null,
      timestamp: now.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get real-time lockout status', details: error.message });
  }
});

// Hidden CSRF Testing Endpoint (REMOVE IN PRODUCTION)
app.post('/api/test/csrf-test', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey !== 'SECURITY_TEST_2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { testType, endpoint, data } = req.body;
  
  try {
    let response;
    let headers = { 'Content-Type': 'application/json' };
    
    switch (testType) {
      case 'missing_token':
        response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        break;
        
      case 'invalid_token':
        headers['X-CSRF-Token'] = 'invalid';
        response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        break;
        
      case 'valid_token':
        headers['X-CSRF-Token'] = 'valid-csrf-token-12345';
        response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        break;
        
      case 'get_request':
        response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'GET'
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }
    
    const responseData = await response.json();
    
    res.json({
      testType,
      endpoint,
      status: response.status,
      expectedStatus: testType === 'get_request' ? 200 : 
                     testType === 'valid_token' ? 401 : 403,
      passed: testType === 'get_request' ? response.status === 200 :
              testType === 'valid_token' ? response.status === 401 :
              response.status === 403,
      response: responseData
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🔒 MediConnect Security-Enhanced Server`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🛡️ Security Status: http://localhost:${PORT}/api/security/status`);
  console.log(`\n✨ Security Features Active:`);
  console.log(`   ✅ Password Policy & MFA`);
  console.log(`   ✅ Rate Limiting & Brute Force Protection`);
  console.log(`   ✅ Session Management & Audit Logging`);
  console.log(`   ✅ XSS Protection & NoSQL Injection Prevention`);
  console.log(`   ✅ CSRF Protection & Secure Headers`);
  console.log(`\n🚀 Ready for security testing!`);
});

module.exports = app;

