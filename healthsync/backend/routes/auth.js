const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // For development, use environment variables or mock authentication
  // In production, use: const serviceAccount = require('../firebase-service-account.json');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      }),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else {
    // Development mode - mock Firebase for testing
    console.log('Firebase Admin SDK not configured, using mock authentication for development');
  }
}

// Register/Login with Firebase token (no validation for testing)
router.post('/firebase-auth', async (req, res) => {
  try {
    const { firebaseToken, email, displayName, role, phoneNumber, profile, medicalInfo } = req.body;

    // Skip Firebase token verification for testing - use mock UID
    const firebaseUid = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Using mock Firebase UID for development:', firebaseUid);

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Create new user
      const sanitizedEmail = email ? email.toLowerCase().trim() : `test${Date.now()}@example.com`;
      const sanitizedDisplayName = displayName ? displayName.trim() : sanitizedEmail.split('@')[0];
      const sanitizedRole = role || 'patient';

      user = new User({
        firebaseUid,
        email: sanitizedEmail,
        displayName: sanitizedDisplayName,
        role: sanitizedRole,
        phoneNumber: phoneNumber || null,
        profile: {
          firstName: sanitizedDisplayName.split(' ')[0] || '',
          lastName: sanitizedDisplayName.split(' ').slice(1).join(' ') || '',
          age: profile?.age || null,
          gender: profile?.gender || null,
          height: profile?.height || null,
          weight: profile?.weight || null
        },
        medicalInfo: {
          conditions: medicalInfo?.conditions || [],
          allergies: medicalInfo?.allergies || [],
          bloodType: medicalInfo?.bloodType || null,
          emergencyContact: medicalInfo?.emergencyContact || null
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          theme: 'light',
          language: 'en'
        },
        healthMetrics: {
          vitalSigns: {
            bloodPressure: null,
            heartRate: null,
            bloodSugar: null,
            temperature: null
          },
          bmi: null,
          lastUpdated: new Date()
        },
        isActive: true,
        lastLogin: new Date()
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { uid: user.firebaseUid, email: user.email, role: user.role, id: user._id },
      process.env.JWT_SECRET || 'healthsync-secret-key-2024',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          profile: user.profile,
          medicalInfo: user.medicalInfo,
          preferences: user.preferences,
          profileComplete: user.isProfileComplete(),
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          profile: user.profile,
          medicalInfo: user.medicalInfo,
          preferences: user.preferences,
          healthMetrics: user.healthMetrics,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateUser, [
  body('displayName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Display name must be between 1 and 100 characters'),
  body('profile.firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('profile.lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('profile.phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('profile.dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('medicalInfo.bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('healthMetrics.height').optional().isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50 and 250 cm'),
  body('healthMetrics.weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedFields = [
      'displayName',
      'profile',
      'medicalInfo',
      'preferences',
      'healthMetrics'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Sanitize input data
        if (typeof req.body[field] === 'string') {
          updates[field] = req.body[field].trim();
        } else if (typeof req.body[field] === 'object') {
          updates[field] = {};
          for (const [key, value] of Object.entries(req.body[field])) {
            updates[field][key] = typeof value === 'string' ? value.trim() : value;
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          displayName: user.displayName,
          profile: user.profile,
          medicalInfo: user.medicalInfo,
          preferences: user.preferences,
          healthMetrics: user.healthMetrics
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change user role (admin only - for development/testing)
router.put('/role', authenticateUser, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['patient', 'doctor', 'hospital'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be patient, doctor, or hospital'
      });
    }

    // In production, only allow role changes by admins
    // For now, allow any authenticated user to change their role for testing
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: { role: user.role }
    });

  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change role'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateUser, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
