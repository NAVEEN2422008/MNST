const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mock mongoose model for testing
const mockUser = {
  firebaseUid: 'test-uid',
  email: 'testuser@example.com',
  displayName: 'Test User',
  role: 'patient',
  profile: {
    firstName: 'Test',
    lastName: 'User'
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  getFullName: function() { return 'Test User'; },
  isProfileComplete: function() { return true; }
};

const mockUserModel = {
  findOne: (query) => Promise.resolve(mockUser),
  findById: (id) => Promise.resolve(mockUser),
  findByIdAndUpdate: (id, updates, options) => Promise.resolve({ ...mockUser, ...updates }),
  find: (query) => Promise.resolve([mockUser]),
  countDocuments: (query) => Promise.resolve(1),
  aggregate: (pipeline) => Promise.resolve([{ totalUsers: 1, activeUsers: 1, patients: 1, doctors: 0, hospitals: 0, profileComplete: 1 }]),
  findByRole: (role) => Promise.resolve([mockUser])
};

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'hospital'],
    default: 'patient'
  },
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    chronicConditions: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      shareData: { type: Boolean, default: false },
      allowResearch: { type: Boolean, default: false }
    },
    units: {
      weight: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
      height: { type: String, enum: ['cm', 'ft'], default: 'cm' },
      temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' }
    }
  },
  healthMetrics: {
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number,
    lastUpdated: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get user's full name
userSchema.methods.getFullName = function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim() || this.displayName;
};

// Instance method to check if user has completed profile
userSchema.methods.isProfileComplete = function() {
  return !!(this.profile.firstName && this.profile.lastName && this.profile.dateOfBirth);
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mockUserModel;
