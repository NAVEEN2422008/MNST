const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin/hospital only)
router.get('/', authenticateUser, authorizeRoles('hospital'), async (req, res) => {
  try {
    const { role, status, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-medicalInfo') // Exclude sensitive medical info
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          profileComplete: user.isProfileComplete(),
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + users.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get user by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user can access this profile
    if (req.user.role === 'patient' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return limited info for non-owners
    const isOwner = req.user._id.toString() === id;
    const responseData = {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profile: user.profile,
      preferences: user.preferences,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    // Include sensitive info only for owners or authorized roles
    if (isOwner || ['doctor', 'hospital'].includes(req.user.role)) {
      responseData.medicalInfo = user.medicalInfo;
      responseData.healthMetrics = user.healthMetrics;
    }

    res.status(200).json({
      success: true,
      data: { user: responseData }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Update user (admin/hospital only)
router.put('/:id', authenticateUser, authorizeRoles('hospital'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.firebaseUid;
    delete updates.email;
    delete updates.medicalInfo; // Medical info should be updated separately

    const user = await User.findByIdAndUpdate(
      id,
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
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Deactivate user account
router.delete('/:id', authenticateUser, authorizeRoles('hospital'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
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
      message: 'User account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
});

// Get user statistics (admin/hospital only)
router.get('/stats/overview', authenticateUser, authorizeRoles('hospital'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          patients: {
            $sum: { $cond: [{ $eq: ['$role', 'patient'] }, 1, 0] }
          },
          doctors: {
            $sum: { $cond: [{ $eq: ['$role', 'doctor'] }, 1, 0] }
          },
          hospitals: {
            $sum: { $cond: [{ $eq: ['$role', 'hospital'] }, 1, 0] }
          },
          profileComplete: {
            $sum: { $cond: ['$profile.firstName', 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      patients: 0,
      doctors: 0,
      hospitals: 0,
      profileComplete: 0
    };

    // Calculate percentages
    result.profileCompletionRate = result.totalUsers > 0
      ? Math.round((result.profileComplete / result.totalUsers) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// Search users
router.get('/search/query', authenticateUser, authorizeRoles('doctor', 'hospital'), [
  query('q').isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
  query('role').optional().isIn(['patient', 'doctor', 'hospital']).withMessage('Role must be patient, doctor, or hospital'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { q, role, limit = 20 } = req.query;

    // Sanitize search query
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
    const searchRegex = new RegExp(sanitizedQuery, 'i');

    const filter = {
      $or: [
        { displayName: searchRegex },
        { email: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ]
    };

    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('displayName email role profile isActive')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          profileComplete: user.isProfileComplete(),
          isActive: user.isActive
        }))
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

module.exports = router;
