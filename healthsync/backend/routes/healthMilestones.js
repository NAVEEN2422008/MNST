const express = require('express');
const HealthMilestone = require('../models/HealthMilestone');
const { authenticateUser, authorizeResource } = require('../middleware/auth');

const router = express.Router();

// Get health milestones for a patient
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { patientId, status, category, limit = 20, skip = 0 } = req.query;

    // Patients can only see their own milestones, doctors/hospitals can see specified patient's milestones
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
    if (status) filter.status = status;
    if (category) filter.category = category;

    const milestones = await HealthMilestone.find(filter)
      .sort({ priority: -1, targetDate: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await HealthMilestone.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        milestones,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: skip + milestones.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get health milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health milestones'
    });
  }
});

// Get single health milestone
router.get('/:id', authenticateUser, authorizeResource('healthMilestone'), async (req, res) => {
  try {
    const milestone = await HealthMilestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Health milestone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { milestone }
    });

  } catch (error) {
    console.error('Get health milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health milestone'
    });
  }
});

// Create health milestone
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { patientId, ...milestoneData } = req.body;

    // Validate required fields
    if (!milestoneData.title || !milestoneData.category || !milestoneData.target) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and target are required'
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

    const milestone = new HealthMilestone({
      ...milestoneData,
      patientId: finalPatientId
    });

    await milestone.save();

    res.status(201).json({
      success: true,
      message: 'Health milestone created successfully',
      data: { milestone }
    });

  } catch (error) {
    console.error('Create health milestone error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create health milestone'
    });
  }
});

// Update health milestone
router.put('/:id', authenticateUser, authorizeResource('healthMilestone'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.patientId;
    delete updates.createdAt;

    const milestone = await HealthMilestone.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Health milestone not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Health milestone updated successfully',
      data: { milestone }
    });

  } catch (error) {
    console.error('Update health milestone error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update health milestone'
    });
  }
});

// Delete health milestone
router.delete('/:id', authenticateUser, authorizeResource('healthMilestone'), async (req, res) => {
  try {
    const milestone = await HealthMilestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Health milestone not found'
      });
    }

    await HealthMilestone.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Health milestone deleted successfully'
    });

  } catch (error) {
    console.error('Delete health milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete health milestone'
    });
  }
});

// Update milestone progress
router.post('/:id/progress', authenticateUser, authorizeResource('healthMilestone'), async (req, res) => {
  try {
    const { id } = req.params;
    const { value, notes } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Progress value is required'
      });
    }

    const milestone = await HealthMilestone.findById(id);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Health milestone not found'
      });
    }

    await milestone.updateProgress(value, notes);

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        milestone,
        progressPercentage: milestone.progressPercentage,
        isCompleted: milestone.status === 'completed'
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Get milestone progress history
router.get('/:id/progress', authenticateUser, authorizeResource('healthMilestone'), async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const milestone = await HealthMilestone.findById(id);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Health milestone not found'
      });
    }

    const progressHistory = milestone.progress
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        progress: progressHistory,
        currentProgress: milestone.currentProgress,
        progressPercentage: milestone.progressPercentage
      }
    });

  } catch (error) {
    console.error('Get progress history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress history'
    });
  }
});

// Get active milestones with gamification data
router.get('/gamification/active', authenticateUser, async (req, res) => {
  try {
    let patientId = req.user._id;
    if (req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const activeMilestones = await HealthMilestone.getActiveMilestones(patientId);

    const gamificationData = activeMilestones.map(milestone => ({
      id: milestone._id,
      title: milestone.title,
      category: milestone.category,
      progressPercentage: milestone.progressPercentage,
      daysRemaining: milestone.daysRemaining,
      priority: milestone.priority,
      rewards: milestone.rewards,
      isOverdue: milestone.isOverdue()
    }));

    res.status(200).json({
      success: true,
      data: { milestones: gamificationData }
    });

  } catch (error) {
    console.error('Get active milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active milestones'
    });
  }
});

// Get completed milestones with rewards
router.get('/gamification/completed', authenticateUser, async (req, res) => {
  try {
    let patientId = req.user._id;
    if (req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const completedMilestones = await HealthMilestone.getCompletedWithRewards(patientId);

    const rewardsData = completedMilestones.map(milestone => ({
      id: milestone._id,
      title: milestone.title,
      category: milestone.category,
      completedDate: milestone.completedDate,
      rewards: milestone.rewards,
      progressPercentage: milestone.progressPercentage
    }));

    res.status(200).json({
      success: true,
      data: { milestones: rewardsData }
    });

  } catch (error) {
    console.error('Get completed milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed milestones'
    });
  }
});

// Get milestone statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    let patientId = req.user._id;
    if (req.user.role !== 'patient' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const stats = await HealthMilestone.aggregate([
      { $match: { patientId: patientId } },
      {
        $group: {
          _id: null,
          totalMilestones: { $sum: 1 },
          activeMilestones: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedMilestones: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pausedMilestones: {
            $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] }
          },
          failedMilestones: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          overdueMilestones: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $lt: ['$targetDate', new Date()] },
                    { $ne: ['$targetDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          categories: { $push: '$category' },
          totalPoints: { $sum: '$rewards.points' }
        }
      }
    ]);

    const result = stats[0] || {
      totalMilestones: 0,
      activeMilestones: 0,
      completedMilestones: 0,
      pausedMilestones: 0,
      failedMilestones: 0,
      overdueMilestones: 0,
      categories: [],
      totalPoints: 0
    };

    // Count categories
    const categoryCount = {};
    result.categories.forEach(category => {
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
    result.categoryBreakdown = categoryCount;

    // Calculate completion rate
    result.completionRate = result.totalMilestones > 0
      ? Math.round((result.completedMilestones / result.totalMilestones) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: { stats: result }
    });

  } catch (error) {
    console.error('Get milestone stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Search milestones
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
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    };

    const milestones = await HealthMilestone.find(filter)
      .sort({ priority: -1, targetDate: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { milestones }
    });

  } catch (error) {
    console.error('Search milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

module.exports = router;
