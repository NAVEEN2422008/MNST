import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import './styles/global.css';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MedicalRecords from './components/MedicalRecords';
import MedicineManagement from './components/MedicineManagement';
import DoctorPortal from './components/DoctorPortal';
import Chatbot from './components/Chatbot';
import HealthMilestones from './components/HealthMilestones';
import Home from './components/Home';
import Settings from './components/Settings';
import About from './components/About';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('patient'); // Default to patient, can be set based on user data

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch user profile from backend to get role
          const idToken = await currentUser.getIdToken();
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setRole(userData.data.user.role);
          } else {
            // Fallback to email-based role detection
            setRole(currentUser.email.includes('doctor') ? 'doctor' : 'patient');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to email-based role detection
          setRole(currentUser.email.includes('doctor') ? 'doctor' : 'patient');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-text">
        {user && <Navbar user={user} role={role} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} role={role} /> : <Navigate to="/auth" />} />
            <Route path="/records" element={user ? <MedicalRecords user={user} /> : <Navigate to="/auth" />} />
            <Route path="/medicines" element={user ? <MedicineManagement user={user} /> : <Navigate to="/auth" />} />
            <Route path="/doctor" element={user && role === 'doctor' ? <DoctorPortal user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="/chatbot" element={user ? <Chatbot user={user} /> : <Navigate to="/auth" />} />
            <Route path="/milestones" element={user ? <HealthMilestones user={user} /> : <Navigate to="/auth" />} />
            <Route path="/settings" element={user ? <Settings user={user} role={role} /> : <Navigate to="/auth" />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
