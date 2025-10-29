const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');
const Medicine = require('../models/Medicine');
const HealthMilestone = require('../models/HealthMilestone');
const User = require('../models/User');

const router = express.Router();

// Import Python AI modules (these would be actual Python script calls)
const { spawn } = require('child_process');

// AI Health Insights
router.get('/insights/health', authenticateUser, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Gather patient data for AI analysis
    const [medicalRecords, medicines, milestones, user] = await Promise.all([
      MedicalRecord.find({ patientId }).sort({ date: -1 }).limit(50),
      Medicine.find({ patientId, status: 'active' }),
      HealthMilestone.find({ patientId, status: 'active' }),
      User.findById(patientId).select('medicalInfo healthMetrics')
    ]);

    // Prepare data for AI analysis
    const healthData = {
      medicalHistory: medicalRecords.map(record => ({
        type: record.recordType,
        diagnosis: record.diagnosis,
        date: record.date,
        symptoms: record.symptoms
      })),
      currentMedications: medicines.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        adherence: med.getAdherenceRate()
      })),
      activeGoals: milestones.map(milestone => ({
        category: milestone.category,
        progress: milestone.progressPercentage,
        targetDate: milestone.targetDate
      })),
      vitalSigns: user?.healthMetrics?.vitalSigns || {},
      medicalInfo: user?.medicalInfo || {}
    };

    // Call Python AI script for health insights
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'health_insights',
      JSON.stringify(healthData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI health insights error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate health insights'
        });
      }

      try {
        const insights = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { insights }
        });
      } catch (parseError) {
        console.error('AI result parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse AI insights'
        });
      }
    });

  } catch (error) {
    console.error('Get health insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health insights'
    });
  }
});

// AI Disease Risk Prediction
router.get('/predictions/disease-risk', authenticateUser, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Get user health data
    const user = await User.findById(patientId).select('profile medicalInfo healthMetrics');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract health metrics for prediction
    const healthData = {
      age: user.profile?.dateOfBirth ?
        Math.floor((new Date() - new Date(user.profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 30,
      bmi: user.healthMetrics?.vitalSigns?.bmi || 25,
      bloodPressure: user.healthMetrics?.vitalSigns?.bloodPressure ?
        parseInt(user.healthMetrics.vitalSigns.bloodPressure.split('/')[0]) : 120,
      glucose: user.healthMetrics?.vitalSigns?.glucose || 90,
      cholesterol: user.healthMetrics?.vitalSigns?.cholesterol || 200,
      smoking: user.medicalInfo?.lifestyle?.smoking === 'yes',
      exercise: user.medicalInfo?.lifestyle?.exercise !== 'none'
    };

    // Call Python AI script for disease risk prediction
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'predict_disease_risks',
      JSON.stringify(healthData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI disease risk prediction error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate disease risk predictions'
        });
      }

      try {
        const predictions = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { predictions }
        });
      } catch (parseError) {
        console.error('AI predictions parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse disease risk predictions'
        });
      }
    });

  } catch (error) {
    console.error('Disease risk prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate disease risk predictions'
    });
  }
});

// AI Medication Recommendations
router.get('/recommendations/medications', authenticateUser, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const { symptoms, currentMedications } = req.query;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required for recommendations'
      });
    }

    // Get patient medical history
    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ date: -1 })
      .limit(20);

    const patientHistory = {
      symptoms: symptoms.split(','),
      currentMedications: currentMedications ? currentMedications.split(',') : [],
      medicalHistory: medicalRecords.map(record => ({
        diagnosis: record.diagnosis,
        medications: record.treatment?.medications || []
      }))
    };

    // Call Python AI script for medication recommendations
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'medication_recommendations',
      JSON.stringify(patientHistory)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI medication recommendations error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate medication recommendations'
        });
      }

      try {
        const recommendations = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { recommendations }
        });
      } catch (parseError) {
        console.error('AI recommendations parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse medication recommendations'
        });
      }
    });

  } catch (error) {
    console.error('Get medication recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medication recommendations'
    });
  }
});

// AI Symptom Analysis
router.post('/analyze/symptoms', authenticateUser, async (req, res) => {
  try {
    const { symptoms, severity, duration, additionalInfo } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required'
      });
    }

    const symptomData = {
      symptoms,
      severity: severity || 'moderate',
      duration: duration || 'recent',
      additionalInfo: additionalInfo || '',
      patientId: req.user._id,
      patientRole: req.user.role
    };

    // Call Python AI script for symptom analysis
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'symptom_analysis',
      JSON.stringify(symptomData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI symptom analysis error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to analyze symptoms'
        });
      }

      try {
        const analysis = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { analysis }
        });
      } catch (parseError) {
        console.error('AI analysis parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse symptom analysis'
        });
      }
    });

  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze symptoms'
    });
  }
});

// AI Health Risk Assessment
router.get('/assessment/risk', authenticateUser, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Gather comprehensive patient data
    const [user, medicalRecords, medicines, milestones] = await Promise.all([
      User.findById(patientId).select('profile medicalInfo healthMetrics'),
      MedicalRecord.find({ patientId }).sort({ date: -1 }).limit(100),
      Medicine.find({ patientId }),
      HealthMilestone.find({ patientId })
    ]);

    const assessmentData = {
      demographics: {
        age: user.profile?.dateOfBirth ?
          Math.floor((new Date() - new Date(user.profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender: user.profile?.gender,
        ethnicity: user.profile?.ethnicity
      },
      medicalHistory: medicalRecords.map(record => ({
        type: record.recordType,
        diagnosis: record.diagnosis,
        date: record.date,
        severity: record.priority || 'moderate'
      })),
      currentMedications: medicines.map(med => ({
        name: med.name,
        category: med.category,
        adherence: med.getAdherenceRate()
      })),
      lifestyle: user.medicalInfo?.lifestyle || {},
      vitalSigns: user.healthMetrics?.vitalSigns || {},
      healthGoals: milestones.filter(m => m.status === 'active').map(m => ({
        category: m.category,
        progress: m.progressPercentage
      }))
    };

    // Call Python AI script for risk assessment
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'risk_assessment',
      JSON.stringify(assessmentData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI risk assessment error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to perform risk assessment'
        });
      }

      try {
        const assessment = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { assessment }
        });
      } catch (parseError) {
        console.error('AI assessment parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse risk assessment'
        });
      }
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform risk assessment'
    });
  }
});

// AI Chatbot Integration
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    const { message, context, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const chatData = {
      message,
      context: context || 'health_assistance',
      conversationHistory: conversationHistory || [],
      userId: req.user._id,
      userRole: req.user.role,
      userProfile: {
        name: req.user.displayName,
        medicalInfo: req.user.medicalInfo
      }
    };

    // Call Python AI script for chatbot response
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'chat_response',
      JSON.stringify(chatData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI chat error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to get AI response'
        });
      }

      try {
        const response = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { response }
        });
      } catch (parseError) {
        console.error('AI chat parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse AI response'
        });
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

// AI Predictive Analytics
router.get('/predictions/health-trends', authenticateUser, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const { timeframe = 90 } = req.query; // days

    // Gather historical health data
    const [medicalRecords, medicines, milestones] = await Promise.all([
      MedicalRecord.find({
        patientId,
        date: { $gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000) }
      }).sort({ date: 1 }),
      Medicine.find({ patientId }),
      HealthMilestone.find({ patientId })
    ]);

    const trendData = {
      timeframe,
      medicalRecords: medicalRecords.map(record => ({
        date: record.date,
        type: record.recordType,
        diagnosis: record.diagnosis,
        vitalSigns: record.vitalSigns
      })),
      medicationAdherence: medicines.map(med => ({
        name: med.name,
        adherenceHistory: med.adherence.slice(-30) // Last 30 records
      })),
      goalProgress: milestones.map(milestone => ({
        category: milestone.category,
        progressHistory: milestone.progress.slice(-20) // Last 20 progress updates
      }))
    };

    // Call Python AI script for trend predictions
    const pythonProcess = spawn('python', [
      './ai_predictions.py',
      'health_trends',
      JSON.stringify(trendData)
    ]);

    let aiResult = '';
    let aiError = '';

    pythonProcess.stdout.on('data', (data) => {
      aiResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      aiError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('AI health trends error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate health trend predictions'
        });
      }

      try {
        const predictions = JSON.parse(aiResult);
        res.status(200).json({
          success: true,
          data: { predictions }
        });
      } catch (parseError) {
        console.error('AI predictions parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse health trend predictions'
        });
      }
    });

  } catch (error) {
    console.error('Health trends prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate health trend predictions'
    });
  }
});

module.exports = router;
