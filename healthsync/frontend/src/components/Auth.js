import React, { useState } from "react";
import { motion } from "framer-motion";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { FaUserPlus, FaSignInAlt, FaEye, FaEyeSlash, FaUserMd, FaHospital, FaUser } from "react-icons/fa";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // Create user profile in backend
        const firebaseToken = await userCredential.user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/firebase-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseToken: firebaseToken,
            email: userCredential.user.email,
            displayName: name,
            role: role,
            phoneNumber: '',
            profile: {
              age: null,
              gender: null,
              height: null,
              weight: null
            },
            medicalInfo: {
              conditions: [],
              allergies: [],
              bloodType: null,
              emergencyContact: null
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create user profile');
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Get user profile from backend
        const firebaseToken = await userCredential.user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/firebase-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseToken: firebaseToken,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || '',
            role: 'patient' // Default for login
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get user profile');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            {isRegistering ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? "Join HealthSync+ for better health management" : "Welcome back to HealthSync+"}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            >
              {error}
            </motion.div>
          )}

          {isRegistering && (
            <>
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex flex-col items-center p-3 border rounded-md transition-colors ${
                      role === 'patient' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <FaUser className={`text-2xl mb-1 ${role === 'patient' ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="text-xs">Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`flex flex-col items-center p-3 border rounded-md transition-colors ${
                      role === 'doctor' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <FaUserMd className={`text-2xl mb-1 ${role === 'doctor' ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="text-xs">Doctor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('hospital')}
                    className={`flex flex-col items-center p-3 border rounded-md transition-colors ${
                      role === 'hospital' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <FaHospital className={`text-2xl mb-1 ${role === 'hospital' ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="text-xs">Hospital</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  {isRegistering ? <FaUserPlus className="mr-2" /> : <FaSignInAlt className="mr-2" />}
                  {isRegistering ? "Sign up" : "Sign in"}
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-primary hover:text-blue-600 font-medium"
            >
              {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
