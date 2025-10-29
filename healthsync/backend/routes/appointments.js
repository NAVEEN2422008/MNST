const express = require('express');
const Appointment = require('../models/Appointment');
const { authenticateUser, authorizeResource } = require('../middleware/auth');

const router = express.Router();

// Get appointments
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { patientId, doctorId, status, startDate, endDate, limit = 20, skip = 0 } = req.query;

    let filter = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
    } else if (patientId) {
      filter.patientId = patientId;
    } else if (doctorId) {
      filter.doctorId = doctorId;
    }

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'displayName profile')
      .populate('doctorId', 'displayName profile')
      .populate('hospitalId', 'displayName profile')
      .sort({ scheduledDate: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + appointments.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
});

// Get single appointment
router.get('/:id', authenticateUser, authorizeResource('appointment'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'displayName profile medicalInfo')
      .populate('doctorId', 'displayName profile')
      .populate('hospitalId', 'displayName profile');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment'
    });
  }
});

// Create appointment
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { patientId, doctorId, ...appointmentData } = req.body;

    // Validate required fields
    if (!appointmentData.title || !appointmentData.scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and scheduled date are required'
      });
    }

    // Set IDs based on role
    let finalPatientId = patientId;
    let finalDoctorId = doctorId;

    if (req.user.role === 'patient') {
      finalPatientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      finalDoctorId = req.user._id;
    }

    if (!finalPatientId || !finalDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and Doctor ID are required'
      });
    }

    // Check for scheduling conflicts
    const conflicts = await Appointment.findConflicts(finalDoctorId, new Date(appointmentData.scheduledDate), appointmentData.duration || 30);

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflict detected',
        data: { conflicts }
      });
    }

    const appointment = new Appointment({
      ...appointmentData,
      patientId: finalPatientId,
      doctorId: finalDoctorId,
      hospitalId: req.user.role === 'hospital' ? req.user._id : appointmentData.hospitalId,
      createdBy: req.user._id
    });

    await appointment.save();

    // Populate the created appointment
    await appointment.populate('patientId', 'displayName profile');
    await appointment.populate('doctorId', 'displayName profile');
    await appointment.populate('hospitalId', 'displayName profile');

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Create appointment error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment'
    });
  }
});

// Update appointment
router.put('/:id', authenticateUser, authorizeResource('appointment'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.patientId;
    delete updates.doctorId;
    delete updates.createdBy;
    delete updates.createdAt;

    // Check for conflicts if date/time is being updated
    if (updates.scheduledDate || updates.duration) {
      const appointment = await Appointment.findById(id);
      if (appointment) {
        const newDate = updates.scheduledDate || appointment.scheduledDate;
        const newDuration = updates.duration || appointment.duration;

        const conflicts = await Appointment.findConflicts(appointment.doctorId, new Date(newDate), newDuration);

        // Exclude current appointment from conflicts
        const filteredConflicts = conflicts.filter(conflict => conflict._id.toString() !== id);

        if (filteredConflicts.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Scheduling conflict detected',
            data: { conflicts: filteredConflicts }
          });
        }
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'displayName profile')
     .populate('doctorId', 'displayName profile')
     .populate('hospitalId', 'displayName profile');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Update appointment error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
});

// Delete appointment
router.delete('/:id', authenticateUser, authorizeResource('appointment'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// Get available time slots for a doctor
router.get('/availability/slots', authenticateUser, async (req, res) => {
  try {
    const { doctorId, date, duration = 30 } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    const appointmentDate = new Date(date);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get existing appointments for the day
    const existingAppointments = await Appointment.find({
      doctorId,
      scheduledDate: {
        $gte: appointmentDate,
        $lt: nextDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).sort({ scheduledDate: 1 });

    // Generate time slots (assuming 9 AM to 5 PM working hours)
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = parseInt(duration);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(appointmentDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + (slotDuration * 60 * 1000));

        // Check if slot conflicts with existing appointments
        const conflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.scheduledDate);
          const aptEnd = new Date(aptStart.getTime() + (apt.duration * 60 * 1000));

          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        if (!conflict) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { slots }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots'
    });
  }
});

// Get appointment statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    let matchFilter = {};

    if (req.user.role === 'patient') {
      matchFilter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      matchFilter.doctorId = req.user._id;
    }

    const stats = await Appointment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          scheduled: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShow: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
          },
          upcoming: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['scheduled', 'confirmed']] },
                    { $gt: ['$scheduledDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          types: { $push: '$appointmentType' }
        }
      }
    ]);

    const result = stats[0] || {
      totalAppointments: 0,
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      upcoming: 0,
      types: []
    };

    // Count appointment types
    const typeCount = {};
    result.types.forEach(type => {
      if (type) {
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    });
    result.typeBreakdown = typeCount;

    res.status(200).json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Search appointments
router.get('/search/query', authenticateUser, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let filter = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
    }

    const searchRegex = new RegExp(q, 'i');
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { reason: searchRegex }
    ];

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'displayName profile')
      .populate('doctorId', 'displayName profile')
      .sort({ scheduledDate: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { appointments }
    });

  } catch (error) {
    console.error('Search appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

module.exports = router;
