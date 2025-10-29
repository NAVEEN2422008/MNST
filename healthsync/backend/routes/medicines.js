const express = require('express');
const Medicine = require('../models/Medicine');
const { authenticateUser, authorizeResource } = require('../middleware/auth');

const router = express.Router();

// Get medicines for a patient
router.get('/', async (req, res) => {
  try {
    const { patientId, status, limit = 20, skip = 0 } = req.query;

    // For testing, use a dummy patientId if not provided
    let queryPatientId = patientId || '507f1f77bcf86cd799439011'; // Dummy ObjectId for testing

    const filter = { patientId: queryPatientId };
    if (status) filter.status = status;

    const medicines = await Medicine.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Medicine.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + medicines.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicines'
    });
  }
});

// Get single medicine
router.get('/:id', authenticateUser, authorizeResource('medicine'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { medicine }
    });

  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicine'
    });
  }
});

// Create medicine (no auth for testing)
router.post('/', (req, res, next) => {
  // Skip auth for testing
  next();
}, async (req, res) => {
  try {
    const { patientId, ...medicineData } = req.body;

    // Validate required fields
    if (!medicineData.name || !medicineData.frequency) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name and frequency are required'
      });
    }

    // Set patient ID based on role - for testing, use a dummy patientId if not provided
    let finalPatientId = patientId || '507f1f77bcf86cd799439011'; // Dummy ObjectId for testing

    const medicine = new Medicine({
      ...medicineData,
      patientId: finalPatientId
    });

    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Create medicine error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add medicine'
    });
  }
});

// Update medicine
router.put('/:id', authenticateUser, authorizeResource('medicine'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.patientId;
    delete updates.createdAt;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Update medicine error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update medicine'
    });
  }
});

// Delete medicine
router.delete('/:id', authenticateUser, authorizeResource('medicine'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine'
    });
  }
});

// Log medicine adherence
router.post('/:id/adherence', authenticateUser, authorizeResource('medicine'), async (req, res) => {
  try {
    const { id } = req.params;
    const { taken, takenAt, skippedReason, sideEffects } = req.body;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Add adherence record
    medicine.adherence.push({
      date: new Date(),
      taken: taken || false,
      takenAt: takenAt ? new Date(takenAt) : taken ? new Date() : undefined,
      skippedReason,
      sideEffects
    });

    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Adherence logged successfully',
      data: {
        adherence: medicine.adherence[medicine.adherence.length - 1]
      }
    });

  } catch (error) {
    console.error('Log adherence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log adherence'
    });
  }
});

// Get medicine adherence history
router.get('/:id/adherence', authenticateUser, authorizeResource('medicine'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    let adherenceRecords = medicine.adherence;

    // Filter by date range
    if (startDate || endDate) {
      adherenceRecords = adherenceRecords.filter(record => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date descending and limit
    adherenceRecords = adherenceRecords
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        adherence: adherenceRecords,
        adherenceRate: medicine.getAdherenceRate()
      }
    });

  } catch (error) {
    console.error('Get adherence history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get adherence history'
    });
  }
});

// Get medicines due for reminder
router.get('/reminders/due', authenticateUser, async (req, res) => {
  try {
    let patientId = req.user._id;
    if (req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const dueMedicines = await Medicine.find({
      patientId,
      status: 'active',
      'reminders.enabled': true
    });

    const now = new Date();
    const reminderWindow = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes from now

    const medicinesDue = dueMedicines.filter(medicine => {
      if (!medicine.frequency.specificTimes || medicine.frequency.specificTimes.length === 0) {
        return false;
      }

      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      for (const time of medicine.frequency.specificTimes) {
        if (time > currentTime) {
          const [hours, minutes] = time.split(':');
          const doseTime = new Date(now);
          doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          if (doseTime >= now && doseTime <= reminderWindow) {
            medicine.nextDoseTime = time;
            return true;
          }
        }
      }

      return false;
    });

    res.status(200).json({
      success: true,
      data: { medicinesDue }
    });

  } catch (error) {
    console.error('Get due reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get due reminders'
    });
  }
});

// Get medicine statistics (no auth for testing)
router.get('/stats/overview', (req, res, next) => {
  // Skip auth for testing
  next();
}, async (req, res) => {
  try {
    // For testing, use a dummy patientId if not authenticated
    let patientId = req.user ? req.user._id : '507f1f77bcf86cd799439011'; // Dummy ObjectId for testing
    if (req.user && req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const stats = await Medicine.aggregate([
      { $match: { patientId: patientId } },
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          activeMedicines: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedMedicines: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          lowStockMedicines: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $lt: ['$inventory.currentStock', '$inventory.lowStockThreshold'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          categories: { $push: '$category' }
        }
      }
    ]);

    const result = stats[0] || {
      totalMedicines: 0,
      activeMedicines: 0,
      completedMedicines: 0,
      lowStockMedicines: 0,
      categories: []
    };

    // Count categories
    const categoryCount = {};
    result.categories.forEach(category => {
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
    result.categoryBreakdown = categoryCount;

    res.status(200).json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get medicine stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Search medicines
router.get('/search/query', authenticateUser, async (req, res) => {
  try {
    const { q, patientId, limit = 20 } = req.query;

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
        { name: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    };

    const medicines = await Medicine.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { medicines }
    });

  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

module.exports = router;
