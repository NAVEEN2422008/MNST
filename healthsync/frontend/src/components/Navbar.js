import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const Navbar = ({ user, role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['patient', 'doctor'] },
    { name: 'Medical Records', path: '/records', roles: ['patient'] },
    { name: 'Medicines', path: '/medicines', roles: ['patient'] },
    { name: 'Doctor Portal', path: '/doctor', roles: ['doctor'] },
    { name: 'AI Assistant', path: '/chatbot', roles: ['patient', 'doctor'] },
    { name: 'Milestones', path: '/milestones', roles: ['patient'] },
    { name: 'Settings', path: '/settings', roles: ['patient', 'doctor'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            HealthSync+
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-text hover:text-primary transition duration-300"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-text">Welcome, {user.displayName || user.email}</span>
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-text hover:text-primary"
              >
                <FaUser />
                <span>Profile</span>
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                >
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-text hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-text hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-text hover:text-primary"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden bg-white border-t"
          >
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block py-2 px-4 text-text hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t pt-2">
              <Link
                to="/settings"
                className="block py-2 px-4 text-text hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left py-2 px-4 text-text hover:bg-gray-100"
              >
                <FaSignOutAlt className="inline mr-2" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
