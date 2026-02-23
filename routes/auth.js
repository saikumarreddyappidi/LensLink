const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Photographer = require('../models/Photographer');
const { protect } = require('../middleware/auth');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
} = require('../services/emailService');

const router = express.Router();

// Wait up to `ms` milliseconds for MongoDB to reach readyState 1
// Also accepts readyState 2 (connecting) and waits for it to resolve
function waitForDB(ms = 40000) {
  return new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve(true);
    const interval = 500;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      if (mongoose.connection.readyState === 1) {
        clearInterval(timer);
        return resolve(true);
      }
      if (elapsed >= ms) {
        clearInterval(timer);
        return resolve(false);
      }
    }, interval);
  });
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['client', 'photographer'])
    .withMessage('Role must be either client or photographer')
], async (req, res) => {
  try {
    // Wait up to 40s for DB (handles cold-start — 8s timeout × ~3 retry cycles)
    const dbReady = await waitForDB(40000);
    if (!dbReady) {
      return res.status(503).json({
        success: false,
        message: 'Cannot reach the database. Please try again in a moment.',
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'client', phone, photographerData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate email verification token (32-byte hex string)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      verificationToken,
      verificationExpire,
      isVerified: false,
    });

    // If registering as photographer, create photographer profile with additional data
    if (role === 'photographer') {
      const photographerProfile = {
        user: user._id,
        bio: photographerData?.bio || '',
        specialties: photographerData?.specialties || [],
        availability: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: {
            start: '09:00',
            end: '17:00'
          },
          timeSlots: []
        }
      };

      // Add profile photo if provided
      if (photographerData?.profilePhoto) {
        photographerProfile.profilePhoto = photographerData.profilePhoto;
        // Also update the user's profile image
        user.profileImage = photographerData.profilePhoto;
        await user.save();
      }

      // Add pricing if provided
      if (photographerData?.hourlyRate) {
        photographerProfile.pricing = {
          hourlyRate: photographerData.hourlyRate
        };
      }

      // Add experience if provided
      if (photographerData?.experience) {
        photographerProfile.experience = {
          yearsOfExperience: photographerData.experience
        };
      }

      // Add location if provided
      if (photographerData?.location) {
        const locationParts = photographerData.location.split(',').map(part => part.trim());
        photographerProfile.location = {
          city: locationParts[0] || '',
          state: locationParts[1] || '',
          address: photographerData.location
        };
      }

      await Photographer.create(photographerProfile);
    }

    // Send verification email (fire & forget – don't block the response)
    sendVerificationEmail(user.email, user.name, verificationToken)
      .then(() => console.log(`📧 Verification email sent to ${user.email}`))
      .catch((err) =>
        console.error('Failed to send verification email:', err.message)
      );

    // Generate JWT so the user can start using the app immediately
    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message:
        'Account created! Please check your email to verify your address.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in user registration: ' + error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────
// @desc    Verify email address via token link
// @route   GET /api/auth/verify-email?token=<token>
// @access  Public
// ─────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
      <html><body style="font-family:Arial;text-align:center;padding:60px;">
        <h2 style="color:red;">❌ Invalid verification link</h2>
        <p>Token missing. Please use the link sent to your email.</p>
        <a href="/" style="color:#f97316;">← Return to LensLink</a>
      </body></html>
    `);
  }

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationExpire: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).send(`
        <html><body style="font-family:Arial;text-align:center;padding:60px;">
          <h2 style="color:red;">❌ Invalid or Expired Link</h2>
          <p>This verification link has expired or already been used.</p>
          <a href="/" style="color:#f97316;">← Return to LensLink</a>
        </body></html>
      `);
    }

    // Mark verified, clear token fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    sendWelcomeEmail(user.email, user.name, user.role)
      .then(() => console.log(`📧 Welcome email sent to ${user.email}`))
      .catch((err) =>
        console.error('Failed to send welcome email:', err.message)
      );

    // Redirect to home with a success message
    return res.redirect(`/?verified=true&name=${encodeURIComponent(user.name)}`);

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).send(`
      <html><body style="font-family:Arial;text-align:center;padding:60px;">
        <h2 style="color:red;">❌ Server Error</h2>
        <p>Something went wrong. Please try again.</p>
        <a href="/" style="color:#f97316;">← Return to LensLink</a>
      </body></html>
    `);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Wait up to 40s for DB (handles cold-start)
    const dbReady = await waitForDB(40000);
    if (!dbReady) {
      return res.status(503).json({
        success: false,
        message: 'Cannot reach the database. Please try again in a moment.',
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists and include password in query
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in user login: ' + error.message,
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    // If user is a photographer, include photographer details
    if (user.role === 'photographer') {
      const photographer = await Photographer.findOne({ user: user._id });
      if (photographer) {
        userData.photographerProfile = photographer;
      }
    }

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
