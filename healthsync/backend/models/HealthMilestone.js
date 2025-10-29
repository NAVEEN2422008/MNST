const mongoose = require('mongoose');

const healthMilestoneSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['weight_loss', 'exercise', 'medication_adherence', 'vital_signs', 'lifestyle', 'custom'],
    required: true
  },
  target: {
    type: {
      type: String,
      enum: ['numeric', 'boolean', 'streak', 'frequency']
    },
    value: mongoose.Schema.Types.Mixed, // Can be number, boolean, or object
    unit: String // e.g., 'kg', 'steps', 'days'
  },
  currentProgress: {
    value: mongoose.Schema.Types.Mixed,
    lastUpdated: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'failed'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetDate: Date,
  completedDate: Date,
  progress: [{
    date: Date,
    value: mongoose.Schema.Types.Mixed,
    notes: String
  }],
  rewards: {
    points: { type: Number, default: 0 },
    badge: String,
    unlocked: { type: Boolean, default: false }
  },
  reminders: {
    enabled: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily'
    },
    customSchedule: [String] // Days of week or specific times
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
healthMilestoneSchema.index({ patientId: 1, status: 1 });
healthMilestoneSchema.index({ category: 1 });
healthMilestoneSchema.index({ targetDate: 1 });
healthMilestoneSchema.index({ tags: 1 });

// Pre-save middleware to update the updatedAt field
healthMilestoneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for progress percentage
healthMilestoneSchema.virtual('progressPercentage').get(function() {
  if (this.target.type === 'boolean') {
    return this.currentProgress.value ? 100 : 0;
  }

  if (this.target.type === 'numeric' && typeof this.target.value === 'number') {
    const progress = (this.currentProgress.value / this.target.value) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  if (this.target.type === 'streak') {
    // For streak goals, calculate based on consecutive days
    const recentProgress = this.progress
      .sort((a, b) => b.date - a.date)
      .slice(0, this.target.value);

    let streak = 0;
    for (const entry of recentProgress) {
      if (entry.value === true) {
        streak++;
      } else {
        break;
      }
    }
    return (streak / this.target.value) * 100;
  }

  return 0;
});

// Virtual for days remaining
healthMilestoneSchema.virtual('daysRemaining').get(function() {
  if (!this.targetDate) return null;
  const today = new Date();
  const diffTime = this.targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to update progress
healthMilestoneSchema.methods.updateProgress = function(newValue, notes = '') {
  this.currentProgress.value = newValue;
  this.currentProgress.lastUpdated = new Date();

  this.progress.push({
    date: new Date(),
    value: newValue,
    notes
  });

  // Check if milestone is completed
  if (this.target.type === 'boolean' && newValue === true) {
    this.status = 'completed';
    this.completedDate = new Date();
    this.rewards.unlocked = true;
  } else if (this.target.type === 'numeric' && newValue >= this.target.value) {
    this.status = 'completed';
    this.completedDate = new Date();
    this.rewards.unlocked = true;
  }

  return this.save();
};

// Instance method to check if milestone is overdue
healthMilestoneSchema.methods.isOverdue = function() {
  if (!this.targetDate) return false;
  return new Date() > this.targetDate && this.status === 'active';
};

// Static method to get active milestones for a patient
healthMilestoneSchema.statics.getActiveMilestones = function(patientId) {
  return this.find({
    patientId,
    status: 'active'
  }).sort({ priority: -1, targetDate: 1 });
};

// Static method to get completed milestones with rewards
healthMilestoneSchema.statics.getCompletedWithRewards = function(patientId) {
  return this.find({
    patientId,
    status: 'completed',
    'rewards.unlocked': true
  }).sort({ completedDate: -1 });
};

module.exports = mongoose.model('HealthMilestone', healthMilestoneSchema);
