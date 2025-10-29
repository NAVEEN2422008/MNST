const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const HealthMilestone = require('../models/HealthMilestone');

const router = express.Router();

// Get user notifications
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { type, status, limit = 20, skip = 0 } = req.query;

    // For now, we'll generate notifications based on user data
    // In a real implementation, you'd have a Notification model
    const notifications = [];

    // Medicine reminders
    if (!type || type === 'medicine') {
      const dueMedicines = await Medicine.find({
        patientId: req.user._id,
        status: 'active',
        'reminders.enabled': true
      }).limit(5);

      const now = new Date();
      const reminderWindow = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now

      for (const medicine of dueMedicines) {
        if (medicine.frequency.specificTimes) {
          for (const time of medicine.frequency.specificTimes) {
            const [hours, minutes] = time.split(':');
            const doseTime = new Date(now);
            doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (doseTime >= now && doseTime <= reminderWindow) {
              notifications.push({
                id: `medicine-${medicine._id}-${time}`,
                type: 'medicine_reminder',
                title: 'Medicine Reminder',
                message: `Time to take ${medicine.name} (${medicine.dosage})`,
                priority: 'high',
                data: {
                  medicineId: medicine._id,
                  medicineName: medicine.name,
                  dosage: medicine.dosage,
                  scheduledTime: time
                },
                createdAt: now,
                read: false
              });
            }
          }
        }
      }
    }

    // Appointment reminders
    if (!type || type === 'appointment') {
      const upcomingAppointments = await Appointment.find({
        patientId: req.user._id,
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledDate: {
          $gte: now,
          $lte: new Date(now.getTime() + (24 * 60 * 60 * 1000)) // Next 24 hours
        }
      }).populate('doctorId', 'displayName').limit(5);

      for (const appointment of upcomingAppointments) {
        const timeDiff = appointment.scheduledDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff <= 2) { // Remind 2 hours before
          notifications.push({
            id: `appointment-${appointment._id}`,
            type: 'appointment_reminder',
            title: 'Appointment Reminder',
            message: `You have an appointment with Dr. ${appointment.doctorId?.displayName || 'your doctor'} in ${Math.round(hoursDiff)} hours`,
            priority: 'high',
            data: {
              appointmentId: appointment._id,
              doctorName: appointment.doctorId?.displayName,
              scheduledDate: appointment.scheduledDate,
              title: appointment.title
            },
            createdAt: now,
            read: false
          });
        }
      }
    }

    // Health milestone reminders
    if (!type || type === 'milestone') {
      const activeMilestones = await HealthMilestone.find({
        patientId: req.user._id,
        status: 'active',
        'reminders.enabled': true
      }).limit(5);

      for (const milestone of activeMilestones) {
        if (milestone.daysRemaining !== null && milestone.daysRemaining <= 7) {
          notifications.push({
            id: `milestone-${milestone._id}`,
            type: 'milestone_reminder',
            title: 'Health Goal Reminder',
            message: `${milestone.title} is due in ${milestone.daysRemaining} days`,
            priority: milestone.priority === 'high' ? 'high' : 'medium',
            data: {
              milestoneId: milestone._id,
              title: milestone.title,
              daysRemaining: milestone.daysRemaining,
              progressPercentage: milestone.progressPercentage
            },
            createdAt: now,
            read: false
          });
        }
      }
    }

    // Filter by status if specified
    let filteredNotifications = notifications;
    if (status === 'unread') {
      filteredNotifications = notifications.filter(n => !n.read);
    } else if (status === 'read') {
      filteredNotifications = notifications.filter(n => n.read);
    }

    // Sort by priority and creation time
    filteredNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          total: filteredNotifications.length,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + paginatedNotifications.length < filteredNotifications.length
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you'd update the notification in the database
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd update all notifications for the user
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Get notification settings
router.get('/settings', authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd fetch user notification preferences
    // For now, return default settings

    const settings = {
      medicineReminders: true,
      appointmentReminders: true,
      milestoneReminders: true,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      reminderTiming: {
        medicine: 15, // minutes before
        appointment: 120, // minutes before
        milestone: 1440 // minutes before (1 day)
      }
    };

    res.status(200).json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings'
    });
  }
});

// Update notification settings
router.put('/settings', authenticateUser, async (req, res) => {
  try {
    const updates = req.body;

    // In a real implementation, you'd update user notification preferences
    // For now, we'll just return the updated settings

    const settings = {
      medicineReminders: updates.medicineReminders ?? true,
      appointmentReminders: updates.appointmentReminders ?? true,
      milestoneReminders: updates.milestoneReminders ?? true,
      emailNotifications: updates.emailNotifications ?? true,
      pushNotifications: updates.pushNotifications ?? true,
      smsNotifications: updates.smsNotifications ?? false,
      reminderTiming: {
        medicine: updates.reminderTiming?.medicine ?? 15,
        appointment: updates.reminderTiming?.appointment ?? 120,
        milestone: updates.reminderTiming?.milestone ?? 1440
      }
    };

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: { settings }
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// Send test notification
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type and message are required'
      });
    }

    // Call Python notification script
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', [
      './notification_system.py',
      'send_test_notification',
      JSON.stringify({
        userId: req.user._id,
        type,
        message,
        userEmail: req.user.email
      })
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Test notification error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send test notification'
        });
      }

      try {
        const response = JSON.parse(result);
        res.status(200).json({
          success: true,
          message: 'Test notification sent successfully',
          data: response
        });
      } catch (parseError) {
        console.error('Test notification parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: 'Failed to parse notification response'
        });
      }
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Get notification statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd aggregate notification data
    // For now, return mock statistics

    const stats = {
      totalNotifications: 0,
      unreadNotifications: 0,
      notificationsByType: {
        medicine_reminder: 0,
        appointment_reminder: 0,
        milestone_reminder: 0
      },
      notificationsByPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      averageResponseTime: 0 // in minutes
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics'
    });
  }
});

module.exports = router;
