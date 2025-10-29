const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: String,
  brandName: String,
  dosage: {
    amount: Number,
    unit: {
      type: String,
      enum: ['mg', 'mcg', 'g', 'ml', 'IU', 'units', 'tablets', 'capsules']
    }
  },
  frequency: {
    timesPerDay: Number,
    intervalHours: Number,
    specificTimes: [String], // e.g., ["08:00", "14:00", "20:00"]
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    durationDays: Number
  },
  prescription: {
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prescriptionDate: Date,
    refillInfo: {
      allowed: { type: Boolean, default: true },
      remaining: Number,
      lastRefillDate: Date,
      nextRefillDate: Date
    }
  },
  instructions: {
    howToTake: String,
    withFood: {
      type: String,
      enum: ['before', 'with', 'after', 'empty_stomach']
    },
    specialInstructions: String
  },
  inventory: {
    currentStock: Number,
    lowStockThreshold: { type: Number, default: 7 }, // days worth
    autoReorder: { type: Boolean, default: false },
    reorderPoint: Number, // quantity that triggers reorder
    supplier: String
  },
  reminders: {
    enabled: { type: Boolean, default: true },
    advanceNotice: { type: Number, default: 15 }, // minutes before dose
    missedDoseAlert: { type: Boolean, default: true }
  },
  adherence: [{
    date: Date,
    taken: Boolean,
    takenAt: Date,
    skippedReason: String,
    sideEffects: String
  }],
  sideEffects: [String],
  interactions: [{
    medicine: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major']
    },
    description: String
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued', 'paused'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['prescription', 'otc', 'supplement', 'vitamin']
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
medicineSchema.index({ patientId: 1, status: 1 });
medicineSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ tags: 1 });

// Pre-save middleware to update the updatedAt field
medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for days remaining
medicineSchema.virtual('daysRemaining').get(function() {
  if (!this.duration.endDate) return null;
  const today = new Date();
  const diffTime = this.duration.endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for next dose time
medicineSchema.virtual('nextDoseTime').get(function() {
  if (!this.frequency.specificTimes || this.frequency.specificTimes.length === 0) return null;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Find the next dose time today
  for (const time of this.frequency.specificTimes) {
    if (time > currentTime) {
      return time;
    }
  }

  // If no more doses today, return first dose tomorrow
  return this.frequency.specificTimes[0];
});

// Instance method to check if medicine needs refill
medicineSchema.methods.needsRefill = function() {
  if (!this.inventory.currentStock || !this.inventory.reorderPoint) return false;
  return this.inventory.currentStock <= this.inventory.reorderPoint;
};

// Instance method to calculate adherence rate
medicineSchema.methods.getAdherenceRate = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentAdherence = this.adherence.filter(record => record.date >= cutoffDate);
  if (recentAdherence.length === 0) return 0;

  const takenCount = recentAdherence.filter(record => record.taken).length;
  return Math.round((takenCount / recentAdherence.length) * 100);
};

// Static method to find medicines due for reminder
medicineSchema.statics.findDueForReminder = function() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes from now

  return this.find({
    status: 'active',
    'reminders.enabled': true,
    'frequency.specificTimes': { $exists: true }
  }).then(medicines => {
    return medicines.filter(medicine => {
      const nextDose = medicine.nextDoseTime;
      if (!nextDose) return false;

      const [hours, minutes] = nextDose.split(':');
      const doseTime = new Date(now);
      doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return doseTime >= now && doseTime <= reminderWindow;
    });
  });
};

module.exports = mongoose.model('Medicine', medicineSchema);
