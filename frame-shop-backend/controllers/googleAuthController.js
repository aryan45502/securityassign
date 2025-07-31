const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

// Google OAuth Strategy Configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: profile.emails[0].value },
        { 'googleAuth.googleId': profile.id }
      ]
    });

    if (user) {
      // Update Google auth info if not present
      if (!user.googleAuth) {
        user.googleAuth = {
          googleId: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken
        };
        await user.save();
      }
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      phone: profile.phoneNumbers ? profile.phoneNumbers[0].value : '',
      password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
      role: 'patient',
      isVerified: true,
      googleAuth: {
        googleId: profile.id,
        accessToken: accessToken,
        refreshToken: refreshToken
      },
      profileImage: profile.photos ? profile.photos[0].value : null
    });

    await newUser.save();

    // Create audit log
    await AuditLog.create({
      userId: newUser._id,
      action: 'REGISTER',
      resourceType: 'USER',
      resourceId: newUser._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      details: {
        method: 'google_oauth',
        googleId: profile.id,
        email: profile.emails[0].value
      }
    });

    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Routes
const googleAuth = {
  // Initiate Google OAuth
  initiate: passport.authenticate('google', {
    scope: ['profile', 'email']
  }),

  // Google OAuth callback
  callback: async (req, res) => {
    passport.authenticate('google', async (err, user, info) => {
      if (err) {
        console.error('Google OAuth callback error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      try {
        // Generate session token
        const sessionId = crypto.randomBytes(32).toString('hex');
        const oauthToken = jwt.sign(
          { 
            userId: user._id, 
            email: user.email, 
            role: user.role,
            sessionId,
            oauthProvider: 'google'
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );

        // Add session to user
        user.addSession(sessionId, req.ip, req.get('User-Agent'), 8 * 60 * 60 * 1000);
        await user.save();

        // Create audit log for successful OAuth login
        await AuditLog.create({
          userId: user._id,
          action: 'LOGIN_SUCCESS',
          resourceType: 'USER',
          resourceId: user._id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          details: {
            method: 'google_oauth',
            sessionId
          }
        });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${oauthToken}&user=${encodeURIComponent(JSON.stringify({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }))}`);

      } catch (error) {
        console.error('Token generation error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
      }
    })(req, res);
  },

  // Link Google account to existing account
  linkAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      const { googleToken } = req.body;

      // Verify Google token and get user info
      // This would require additional Google API calls
      // For now, we'll implement a simplified version

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Update user with Google auth info
      user.googleAuth = {
        googleId: 'linked_account', // This would be the actual Google ID
        accessToken: googleToken,
        refreshToken: null
      };

      await user.save();

      await AuditLog.create({
        userId: user._id,
        action: 'MFA_ENABLED',
        resourceType: 'USER',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        details: {
          method: 'google_oauth_link'
        }
      });

      res.json({
        message: 'Google account linked successfully'
      });

    } catch (error) {
      console.error('Link Google account error:', error);
      res.status(500).json({
        error: 'Failed to link Google account',
        message: 'An error occurred while linking your Google account'
      });
    }
  },

  // Unlink Google account
  unlinkAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Remove Google auth info
      user.googleAuth = null;
      await user.save();

      await AuditLog.create({
        userId: user._id,
        action: 'MFA_DISABLED',
        resourceType: 'USER',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        details: {
          method: 'google_oauth_unlink'
        }
      });

      res.json({
        message: 'Google account unlinked successfully'
      });

    } catch (error) {
      console.error('Unlink Google account error:', error);
      res.status(500).json({
        error: 'Failed to unlink Google account',
        message: 'An error occurred while unlinking your Google account'
      });
    }
  },

  // Get OAuth status
  getStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('googleAuth');

      res.json({
        googleLinked: !!user.googleAuth,
        oauthEnabled: true
      });

    } catch (error) {
      console.error('Get OAuth status error:', error);
      res.status(500).json({
        error: 'Failed to get OAuth status',
        message: 'An error occurred while getting OAuth status'
      });
    }
  }
};

module.exports = {
  passport,
  googleAuth
}; 