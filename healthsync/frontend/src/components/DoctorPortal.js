import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUserMd, FaUsers, FaCalendarAlt, FaStethoscope, FaFileMedical, FaComment, FaSearch, FaFilter } from "react-icons/fa";

const DoctorPortal = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/users/patients`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data.data.patients || []);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        // Fallback to mock data
        const mockPatients = [
          {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            condition: "Hypertension",
            progress: "Improving",
            lastVisit: "2024-01-15",
            nextAppointment: "2024-02-01",
            vitalSigns: { bloodPressure: "120/80", heartRate: 72 },
            medications: ["Lisinopril 10mg", "Amlodipine 5mg"],
            comments: [
              { id: 1, text: "Patient showing good improvement with medication", date: "2024-01-15", doctor: "Dr. Smith" }
            ]
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane.smith@example.com",
            condition: "Diabetes",
            progress: "Stable",
            lastVisit: "2024-01-10",
            nextAppointment: "2024-01-25",
            vitalSigns: { bloodSugar: 95, heartRate: 68 },
            medications: ["Metformin 500mg", "Insulin"],
            comments: [
              { id: 2, text: "Blood sugar levels stable, continue current regimen", date: "2024-01-10", doctor: "Dr. Smith" }
            ]
          },
        ];
        setPatients(mockPatients);
      } finally {
        setLoading(false);
      }
    };

    const fetchAppointments = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/appointments/doctor`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAppointments(data.data.appointments || []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    if (user) {
      fetchPatients();
      fetchAppointments();
    }
  }, [user]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || patient.progress.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const addComment = async (patientId) => {
    if (!newComment.trim()) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/users/${patientId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment,
          doctorId: user.uid,
          doctorName: user.displayName || 'Doctor'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(prevPatients =>
          prevPatients.map(patient =>
            patient.id === patientId
              ? { ...patient, comments: [...(patient.comments || []), data.data.comment] }
              : patient
          )
        );
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getProgressColor = (progress) => {
    const colors = {
      'improving': 'text-green-600 bg-green-100',
      'stable': 'text-blue-600 bg-blue-100',
      'declining': 'text-red-600 bg-red-100',
      'critical': 'text-red-800 bg-red-200'
    };
    return colors[progress.toLowerCase()] || 'text-gray-600 bg-gray-100';
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
      className="max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <FaUserMd className="mr-3" />
          Doctor Portal
        </h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="improving">Improving</option>
            <option value="stable">Stable</option>
            <option value="declining">Declining</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaUsers className="text-3xl text-primary mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Total Patients</h3>
          <p className="text-2xl font-bold text-primary">{patients.length}</p>
        </motion.div>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaCalendarAlt className="text-3xl text-secondary mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Today's Appointments</h3>
          <p className="text-2xl font-bold text-secondary">
            {appointments.filter(apt => new Date(apt.date).toDateString() === new Date().toDateString()).length}
          </p>
        </motion.div>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaStethoscope className="text-3xl text-accent mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Critical Cases</h3>
          <p className="text-2xl font-bold text-accent">
            {patients.filter(p => p.progress.toLowerCase() === 'critical').length}
          </p>
        </motion.div>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaFileMedical className="text-3xl text-green-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Improving</h3>
          <p className="text-2xl font-bold text-green-600">
            {patients.filter(p => p.progress.toLowerCase() === 'improving').length}
          </p>
        </motion.div>
      </div>

      {/* Patients List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaUsers className="mr-2 text-primary" />
            Patient List
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border rounded-lg cursor-pointer transition duration-300 ${
                  selectedPatient?.id === patient.id ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{patient.name}</h3>
                    <p className="text-sm text-gray-600">{patient.condition}</p>
                    <p className="text-xs text-gray-500">Last visit: {patient.lastVisit}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(patient.progress)}`}>
                    {patient.progress}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Patient Details */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          {selectedPatient ? (
            <>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaFileMedical className="mr-2 text-primary" />
                Patient Details
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Condition</p>
                    <p className="text-sm">{selectedPatient.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Progress</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(selectedPatient.progress)}`}>
                      {selectedPatient.progress}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Vital Signs</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedPatient.vitalSigns || {}).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Medications</p>
                  <ul className="text-sm space-y-1">
                    {selectedPatient.medications?.map((med, index) => (
                      <li key={index} className="bg-blue-50 p-2 rounded">{med}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Next Appointment</p>
                  <p className="text-sm">{selectedPatient.nextAppointment || 'Not scheduled'}</p>
                </div>

                {/* Comments Section */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaComment className="mr-1" />
                    Comments
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedPatient.comments?.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded text-sm">
                        <p>{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.doctor} - {new Date(comment.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      rows="2"
                    />
                    <button
                      onClick={() => addComment(selectedPatient.id)}
                      className="mt-2 bg-primary text-white px-4 py-1 rounded-md hover:bg-blue-600 transition duration-300 text-sm"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FaFileMedical className="text-4xl mx-auto mb-4 opacity-50" />
              <p>Select a patient to view details</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DoctorPortal;
