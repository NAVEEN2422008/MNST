import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaBell, FaShieldAlt, FaMoon, FaSun } from 'react-icons/fa';

const Settings = ({ user, role }) => {
  const [profile, setProfile] = useState({
    name: user.displayName || '',
    email: user.email || '',
    age: '',
    gender: '',
    address: '',
    medicalConditions: '',
    photo: null,
  });
  const [notifications, setNotifications] = useState({
    medicineReminders: true,
    aiInsights: true,
    weeklyReports: false,
    emergencyAlerts: true,
  });
  const [darkMode, setDarkMode] = useState(false);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // In a real app, update profile in database
    alert('Profile updated successfully!');
  };

  const handleNotificationUpdate = (e) => {
    e.preventDefault();
    // In a real app, update notification preferences in database
    alert('Notification preferences updated!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-8 text-primary">Settings</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaUser className="mr-2 text-primary" />
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="3"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Medical Conditions</label>
              <textarea
                value={profile.medicalConditions}
                onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="3"
                placeholder="List any existing medical conditions..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Update Profile
            </button>
          </form>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-primary" />
            Notifications
          </h2>
          <form onSubmit={handleNotificationUpdate}>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="medicineReminders"
                  checked={notifications.medicineReminders}
                  onChange={(e) => setNotifications({ ...notifications, medicineReminders: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="medicineReminders">Medicine Reminders</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aiInsights"
                  checked={notifications.aiInsights}
                  onChange={(e) => setNotifications({ ...notifications, aiInsights: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="aiInsights">AI Health Insights</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="weeklyReports"
                  checked={notifications.weeklyReports}
                  onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="weeklyReports">Weekly Health Reports</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergencyAlerts"
                  checked={notifications.emergencyAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emergencyAlerts: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="emergencyAlerts">Emergency Alerts</label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 mt-4"
            >
              Update Notifications
            </button>
          </form>
        </motion.div>
      </div>

      {/* Additional Settings */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-lg shadow-lg mt-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaShieldAlt className="mr-2 text-primary" />
          Privacy & Security
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Data Privacy</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your health data is encrypted and stored securely. We comply with HIPAA standards.
            </p>
            <button className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300">
              Request Data Deletion
            </button>
          </div>
          <div>
            <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add an extra layer of security to your account.
            </p>
            <button className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300">
              Enable 2FA
            </button>
          </div>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-lg shadow-lg mt-8"
      >
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              darkMode ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {darkMode ? <FaMoon className="absolute left-1 text-white" size={12} /> : <FaSun className="absolute right-1 text-yellow-500" size={12} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
