const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify Firebase token and get user
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify Firebase token (you would implement Firebase token verification here)
    // For now, we'll assume the token is valid and contains user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthsync-secret-key-2024');

    // Find user in database
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user has required role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user owns the resource or is authorized
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.body.patientId || req.body.userId;

      if (!resourceId) {
        return next();
      }

      // If user is patient, they can only access their own resources
      if (req.user.role === 'patient') {
        if (resourceId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Can only access own resources'
          });
        }
      }
      // Doctors can access resources of their patients
      else if (req.user.role === 'doctor') {
        // Additional logic can be added here to check doctor-patient relationships
        // For now, allow access
      }
      // Hospitals can access all resources
      else if (req.user.role === 'hospital') {
        // Allow access
      }

      next();
    } catch (error) {
      console.error('Resource authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Middleware to validate request data
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles,
  authorizeResource,
  validateRequest
};
