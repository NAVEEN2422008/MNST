import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaStar, FaMedal, FaFire, FaCheckCircle, FaCircle, FaPlus } from "react-icons/fa";

const HealthMilestones = ({ user }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    category: 'fitness',
    targetValue: 1,
    targetDate: ''
  });

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/health-milestones`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMilestones(data.data.milestones || []);
          calculateStats(data.data.milestones || []);
        }
      } catch (error) {
        console.error('Error fetching milestones:', error);
        // Fallback to mock data
        const mockMilestones = [
          { id: 1, title: "Logged Vitals for 7 Days", achieved: true, category: 'monitoring', points: 50, progress: 100, targetValue: 7, currentValue: 7 },
          { id: 2, title: "Maintained Healthy BMI for a Month", achieved: false, category: 'fitness', points: 100, progress: 75, targetValue: 30, currentValue: 22 },
          { id: 3, title: "Completed 10,000 Steps in a Day", achieved: false, category: 'activity', points: 25, progress: 85, targetValue: 10000, currentValue: 8500 },
          { id: 4, title: "Perfect Medication Adherence Week", achieved: true, category: 'medication', points: 75, progress: 100, targetValue: 7, currentValue: 7 },
        ];
        setMilestones(mockMilestones);
        calculateStats(mockMilestones);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMilestones();
    }
  }, [user]);

  const calculateStats = (milestoneList) => {
    const points = milestoneList.reduce((sum, m) => sum + (m.achieved ? m.points : 0), 0);
    setTotalPoints(points);

    // Calculate streak (consecutive days with achievements)
    const today = new Date();
    let currentStreak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const hasAchievement = milestoneList.some(m =>
        m.achieved && new Date(m.achievedDate).toDateString() === date.toDateString()
      );
      if (hasAchievement) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  };

  const handleAddMilestone = async () => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/health-milestones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMilestone),
      });

      if (response.ok) {
        const data = await response.json();
        setMilestones(prev => [...prev, data.data.milestone]);
        setShowAddForm(false);
        setNewMilestone({
          title: '',
          description: '',
          category: 'fitness',
          targetValue: 1,
          targetDate: ''
        });
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fitness: '🏃',
      nutrition: '🥗',
      medication: '💊',
      monitoring: '📊',
      activity: '🚶',
      sleep: '😴',
      mental: '🧠'
    };
    return icons[category] || '🎯';
  };

  const getCategoryColor = (category) => {
    const colors = {
      fitness: 'bg-green-100 text-green-800',
      nutrition: 'bg-orange-100 text-orange-800',
      medication: 'bg-blue-100 text-blue-800',
      monitoring: 'bg-purple-100 text-purple-800',
      activity: 'bg-pink-100 text-pink-800',
      sleep: 'bg-indigo-100 text-indigo-800',
      mental: 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <FaTrophy className="mr-3" />
          Health Milestones & Gamification
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Milestone
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaStar className="text-4xl mx-auto mb-2" />
          <h3 className="text-xl font-semibold">Total Points</h3>
          <p className="text-3xl font-bold">{totalPoints}</p>
        </motion.div>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-red-400 to-red-600 text-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaFire className="text-4xl mx-auto mb-2" />
          <h3 className="text-xl font-semibold">Current Streak</h3>
          <p className="text-3xl font-bold">{streak} days</p>
        </motion.div>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-400 to-green-600 text-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaMedal className="text-4xl mx-auto mb-2" />
          <h3 className="text-xl font-semibold">Achievements</h3>
          <p className="text-3xl font-bold">{milestones.filter(m => m.achieved).length}</p>
        </motion.div>
      </div>

      {/* Milestones Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${
              milestone.achieved ? 'border-green-500' : 'border-gray-300'
            } hover:shadow-xl transition duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(milestone.category)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{milestone.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(milestone.category)}`}>
                    {milestone.category}
                  </span>
                </div>
              </div>
              {milestone.achieved ? (
                <FaCheckCircle className="text-green-500 text-xl" />
              ) : (
                <FaCircle className="text-gray-400 text-xl" />
              )}
            </div>

            {milestone.description && (
              <p className="text-gray-600 text-sm mb-4">{milestone.description}</p>
            )}

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{milestone.currentValue || 0} / {milestone.targetValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${milestone.progress || 0}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-2 rounded-full ${milestone.achieved ? 'bg-green-500' : 'bg-primary'}`}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-primary">{milestone.points} points</span>
              {milestone.targetDate && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(milestone.targetDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Milestone Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Add New Milestone</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Milestone title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <textarea
                placeholder="Description (optional)"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="3"
              />
              <select
                value={newMilestone.category}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="fitness">Fitness</option>
                <option value="nutrition">Nutrition</option>
                <option value="medication">Medication</option>
                <option value="monitoring">Monitoring</option>
                <option value="activity">Activity</option>
                <option value="sleep">Sleep</option>
                <option value="mental">Mental Health</option>
              </select>
              <input
                type="number"
                placeholder="Target value"
                value={newMilestone.targetValue}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, targetValue: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleAddMilestone}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
              >
                Add Milestone
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HealthMilestones;
