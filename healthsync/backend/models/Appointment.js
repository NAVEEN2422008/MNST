const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow_up', 'emergency', 'checkup', 'procedure', 'vaccination'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 480
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    facility: String,
    room: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    virtual: {
      type: Boolean,
      default: false
    },
    meetingLink: String
  },
  symptoms: [String],
  reason: String,
  notes: {
    patientNotes: String,
    doctorNotes: String,
    internalNotes: String
  },
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    oxygenSaturation: Number
  },
  diagnosis: {
    code: String,
    description: String
  },
  treatment: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    procedures: [String],
    instructions: String
  },
  followUp: {
    required: Boolean,
    date: Date,
    instructions: String
  },
  reminders: {
    patientReminder: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    doctorReminder: {
      enabled: { type: Boolean, default: true },
      sent: { type: Boolean, default: false },
      sentAt: Date
    }
  },
  insurance: {
    covered: Boolean,
    copay: Number,
    authorizationRequired: Boolean,
    authorizationNumber: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
appointmentSchema.index({ patientId: 1, scheduledDate: -1 });
appointmentSchema.index({ doctorId: 1, scheduledDate: -1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentType: 1 });

// Pre-save middleware to update the updatedAt field
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for end time
appointmentSchema.virtual('endTime').get(function() {
  return new Date(this.scheduledDate.getTime() + (this.duration * 60 * 1000));
});

// Virtual for formatted date and time
appointmentSchema.virtual('formattedDateTime').get(function() {
  return {
    date: this.scheduledDate.toLocaleDateString(),
    time: this.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTime: this.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
});

// Instance method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  return this.scheduledDate > new Date() && this.status === 'scheduled';
};

// Instance method to check if appointment is today
appointmentSchema.methods.isToday = function() {
  const today = new Date();
  const appointmentDate = new Date(this.scheduledDate);
  return appointmentDate.toDateString() === today.toDateString();
};

// Instance method to check if appointment needs reminder
appointmentSchema.methods.needsReminder = function(hoursBefore = 24) {
  const now = new Date();
  const reminderTime = new Date(this.scheduledDate.getTime() - (hoursBefore * 60 * 60 * 1000));
  return now >= reminderTime && this.status === 'scheduled' && !this.reminders.patientReminder.sent;
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, userId, userRole) {
  const query = {
    scheduledDate: { $gte: startDate, $lte: endDate }
  };

  if (userRole === 'patient') {
    query.patientId = userId;
  } else if (userRole === 'doctor') {
    query.doctorId = userId;
  }

  return this.find(query).populate('patientId', 'displayName profile').populate('doctorId', 'displayName profile');
};

// Static method to find conflicting appointments
appointmentSchema.statics.findConflicts = function(doctorId, date, duration) {
  const startTime = new Date(date);
  const endTime = new Date(date.getTime() + (duration * 60 * 1000));

  return this.find({
    doctorId,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [
      {
        scheduledDate: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
