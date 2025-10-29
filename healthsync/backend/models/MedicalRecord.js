const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordType: {
    type: String,
    enum: ['consultation', 'lab_result', 'prescription', 'imaging', 'vaccination', 'surgery', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  diagnosis: {
    code: String, // ICD-10 code
    description: String
  },
  symptoms: [String],
  treatment: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    procedures: [String],
    instructions: String
  },
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    oxygenSaturation: Number
  },
  labResults: [{
    testName: String,
    value: String,
    unit: String,
    referenceRange: String,
    status: {
      type: String,
      enum: ['normal', 'high', 'low', 'critical']
    },
    date: Date
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    ocrText: String, // Extracted text from OCR
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    doctorNotes: String,
    patientNotes: String
  },
  followUp: {
    required: Boolean,
    date: Date,
    instructions: String
  },
  facility: {
    name: String,
    address: String,
    phone: String
  },
  isConfidential: {
    type: Boolean,
    default: false
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
medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ 'diagnosis.code': 1 });
medicalRecordSchema.index({ tags: 1 });

// Pre-save middleware to update the updatedAt field
medicalRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted date
medicalRecordSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Instance method to check if record is recent (within last 30 days)
medicalRecordSchema.methods.isRecent = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.date >= thirtyDaysAgo;
};

// Static method to find records by patient and date range
medicalRecordSchema.statics.findByPatientAndDateRange = function(patientId, startDate, endDate) {
  return this.find({
    patientId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
