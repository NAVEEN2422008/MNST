const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const { authenticateUser, authorizeResource } = require('../middleware/auth');
const { createWorker } = require('tesseract.js');
const { pdf2pic } = require('pdf2pic');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/medical-records');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB default
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload medical record with OCR
router.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description, recordType, date } = req.body;

    // Validate required fields
    if (!title || !recordType || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title, record type, and date are required'
      });
    }

    let extractedData = {};
    let ocrText = '';

    // Perform OCR on image files and PDFs
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const worker = await createWorker(process.env.TESSERACT_LANG || 'eng');
        const { data: { text } } = await worker.recognize(req.file.path);
        ocrText = text;
        await worker.terminate();

        // Basic data extraction from OCR text (can be enhanced with AI)
        extractedData = extractHealthDataFromText(text);
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
      }
    } else if (req.file.mimetype === 'application/pdf') {
      try {
        // Convert PDF to images and perform OCR
        const convert = pdf2pic.fromPath(req.file.path, {
          density: 200,
          saveFilename: "page",
          savePath: path.dirname(req.file.path),
          format: "png",
          width: 2000,
          height: 2000
        });

        const pages = [];
        for (let i = 1; i <= 5; i++) { // Process first 5 pages
          try {
            const result = await convert(i);
            if (result) pages.push(result);
          } catch (e) {
            break; // No more pages
          }
        }

        const worker = await createWorker(process.env.TESSERACT_LANG || 'eng');
        for (const page of pages) {
          const { data: { text } } = await worker.recognize(page.path);
          ocrText += text + '\n';
        }
        await worker.terminate();

        // Clean up temporary image files
        pages.forEach(page => {
          if (fs.existsSync(page.path)) {
            fs.unlinkSync(page.path);
          }
        });

        // Basic data extraction from OCR text
        extractedData = extractHealthDataFromText(ocrText);
      } catch (pdfError) {
        console.error('PDF OCR processing error:', pdfError);
      }
    }

    const record = new MedicalRecord({
      title,
      description,
      recordType,
      date: new Date(date),
      patientId: req.user._id,
      attachments: [{
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/medical-records/${req.file.filename}`,
        ocrText
      }],
      extractedData,
      tags: [] // Can be populated based on extracted data
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: 'Medical record uploaded and processed successfully',
      data: { record }
    });

  } catch (error) {
    console.error('Upload medical record error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload medical record'
    });
  }
});

// Helper function to extract health data from OCR text
function extractHealthDataFromText(text) {
  const extractedData = {};

  // Basic regex patterns for common health data
  const patterns = {
    bloodPressure: /blood pressure[:\s]*(\d{2,3}\/\d{2,3})/i,
    heartRate: /heart rate[:\s]*(\d{2,3})\s*(?:bpm)?/i,
    temperature: /temperature[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:°?f|°?c|fahrenheit|celsius)?/i,
    weight: /weight[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:lbs?|kg|kilograms?|pounds?)/i,
    height: /height[:\s]*(\d{1,2}'?\d*"?)|(\d{2,3}(?:\.\d)?)\s*(?:cm|inches?|in)/i,
    glucose: /glucose[:\s]*(\d{2,3})\s*(?:mg\/dl)?/i,
    cholesterol: /cholesterol[:\s]*(\d{2,3})\s*(?:mg\/dl)?/i,
    hemoglobin: /hemoglobin[:\s]*(\d{1,2}(?:\.\d)?)\s*(?:g\/dl)?/i
  };

  // Extract data using patterns
  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      extractedData[key] = match[1] || match[2];
    }
  });

  // Extract dates
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const dates = text.match(datePattern);
  if (dates) {
    extractedData.dates = dates.slice(0, 3); // Limit to first 3 dates
  }

  // Extract medications (basic pattern)
  const medicationPattern = /(?:medication|drug|prescription)[:\s]*([^\n\r]+)/gi;
  const medications = [];
  let medMatch;
  while ((medMatch = medicationPattern.exec(text)) !== null) {
    medications.push(medMatch[1].trim());
  }
  if (medications.length > 0) {
    extractedData.medications = medications.slice(0, 5); // Limit to 5
  }

  return extractedData;
}

// Get medical records for a patient
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { patientId, recordType, limit = 20, skip = 0, startDate, endDate } = req.query;

    // Patients can only see their own records, doctors/hospitals can see specified patient's records
    let queryPatientId = patientId;
    if (req.user.role === 'patient') {
      queryPatientId = req.user._id;
    } else if (!queryPatientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required for non-patient users'
      });
    }

    const filter = { patientId: queryPatientId };
    if (recordType) filter.recordType = recordType;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await MedicalRecord.find(filter)
      .populate('patientId', 'displayName profile')
      .populate('doctorId', 'displayName profile')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await MedicalRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + records.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical records'
    });
  }
});

// Get single medical record
router.get('/:id', authenticateUser, authorizeResource('medicalRecord'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'displayName profile medicalInfo')
      .populate('doctorId', 'displayName profile');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { record }
    });

  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical record'
    });
  }
});

// Create medical record
router.post('/', authenticateUser, upload.array('attachments', 5), async (req, res) => {
  try {
    const { patientId, ...recordData } = req.body;

    // Validate required fields
    if (!recordData.title || !recordData.recordType || !recordData.date) {
      return res.status(400).json({
        success: false,
        message: 'Title, record type, and date are required'
      });
    }

    // Set patient ID based on role
    let finalPatientId = patientId;
    if (req.user.role === 'patient') {
      finalPatientId = req.user._id;
    } else if (!finalPatientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    // Process attachments and OCR if needed
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let ocrText = '';

        // Perform OCR on image files and PDFs
        if (file.mimetype.startsWith('image/')) {
          try {
            const worker = await createWorker(process.env.TESSERACT_LANG || 'eng');
            const { data: { text } } = await worker.recognize(file.path);
            ocrText = text;
            await worker.terminate();
          } catch (ocrError) {
            console.error('OCR processing error:', ocrError);
          }
        } else if (file.mimetype === 'application/pdf') {
          try {
            // Convert PDF to images and perform OCR
            const convert = pdf2pic.fromPath(file.path, {
              density: 200,
              saveFilename: "page",
              savePath: path.dirname(file.path),
              format: "png",
              width: 2000,
              height: 2000
            });

            const pages = [];
            for (let i = 1; i <= 5; i++) { // Process first 5 pages
              try {
                const result = await convert(i);
                if (result) pages.push(result);
              } catch (e) {
                break; // No more pages
              }
            }

            const worker = await createWorker(process.env.TESSERACT_LANG || 'eng');
            for (const page of pages) {
              const { data: { text } } = await worker.recognize(page.path);
              ocrText += text + '\n';
            }
            await worker.terminate();

            // Clean up temporary image files
            pages.forEach(page => {
              if (fs.existsSync(page.path)) {
                fs.unlinkSync(page.path);
              }
            });
          } catch (pdfError) {
            console.error('PDF OCR processing error:', pdfError);
          }
        }

        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/medical-records/${file.filename}`,
          ocrText
        });
      }
    }

    const record = new MedicalRecord({
      ...recordData,
      patientId: finalPatientId,
      doctorId: req.user.role === 'doctor' ? req.user._id : recordData.doctorId,
      attachments
    });

    await record.save();

    // Populate the created record
    await record.populate('patientId', 'displayName profile');
    await record.populate('doctorId', 'displayName profile');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { record }
    });

  } catch (error) {
    console.error('Create medical record error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create medical record'
    });
  }
});

// Update medical record
router.put('/:id', authenticateUser, authorizeResource('medicalRecord'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.patientId;
    delete updates.createdAt;

    // Process new attachments
    if (req.files && req.files.length > 0) {
      let newAttachments = updates.attachments || [];

      for (const file of req.files) {
        let ocrText = '';

        if (file.mimetype.startsWith('image/')) {
          try {
            const worker = await createWorker(process.env.TESSERACT_LANG || 'eng');
            const { data: { text } } = await worker.recognize(file.path);
            ocrText = text;
            await worker.terminate();
          } catch (ocrError) {
            console.error('OCR processing error:', ocrError);
          }
        }

        newAttachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/medical-records/${file.filename}`,
          ocrText
        });
      }

      updates.attachments = newAttachments;
    }

    const record = await MedicalRecord.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'displayName profile')
     .populate('doctorId', 'displayName profile');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      data: { record }
    });

  } catch (error) {
    console.error('Update medical record error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update medical record'
    });
  }
});

// Delete medical record
router.delete('/:id', authenticateUser, authorizeResource('medicalRecord'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Delete associated files
    if (record.attachments && record.attachments.length > 0) {
      for (const attachment of record.attachments) {
        const filePath = path.join(__dirname, '../uploads/medical-records', attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: false,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medical record'
    });
  }
});

// Search medical records
router.get('/search/query', authenticateUser, async (req, res) => {
  try {
    const { q, patientId, recordType, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let queryPatientId = patientId;
    if (req.user.role === 'patient') {
      queryPatientId = req.user._id;
    }

    const searchRegex = new RegExp(q, 'i');
    const filter = {
      patientId: queryPatientId,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { diagnosis: searchRegex },
        { 'attachments.ocrText': searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    };

    if (recordType) filter.recordType = recordType;

    const records = await MedicalRecord.find(filter)
      .populate('patientId', 'displayName profile')
      .populate('doctorId', 'displayName profile')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { records }
    });

  } catch (error) {
    console.error('Search medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// Get medical record statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    let patientId = req.user._id;
    if (req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const stats = await MedicalRecord.aggregate([
      { $match: { patientId: patientId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          recordTypes: {
            $push: '$recordType'
          },
          recentRecords: {
            $sum: {
              $cond: [
                { $gte: ['$date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { totalRecords: 0, recordTypes: [], recentRecords: 0 };

    // Count record types
    const typeCount = {};
    result.recordTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    result.recordTypeBreakdown = typeCount;

    res.status(200).json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get medical record stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

module.exports = router;
