import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { FaHeartbeat, FaWeight, FaWalking, FaBrain, FaRobot, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ user, role }) => {
  const [vitals, setVitals] = useState({
    bloodPressure: 120,
    heartRate: 72,
    bloodSugar: 95,
    weight: 70,
    temperature: 98.6,
    sleepHours: 8,
    steps: 8500,
  });
  const [aiInsights, setAiInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(85);
  const [diseaseRisks, setDiseaseRisks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idToken = await user.getIdToken();

        // Fetch user vitals and health data
        const [vitalsResponse, aiResponse, risksResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${idToken}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/insights/health`, {
            headers: { 'Authorization': `Bearer ${idToken}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/predictions/disease-risk`, {
            headers: { 'Authorization': `Bearer ${idToken}` },
          })
        ]);

        if (vitalsResponse.ok) {
          const vitalsData = await vitalsResponse.json();
          if (vitalsData.data.user.healthMetrics?.vitalSigns) {
            setVitals(prev => ({
              ...prev,
              ...vitalsData.data.user.healthMetrics.vitalSigns
            }));
          }
        }

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          setAiInsights(aiData.data.insights || []);
          setHealthScore(aiData.data.healthScore || 85);
        }

        if (risksResponse.ok) {
          const risksData = await risksResponse.json();
          setDiseaseRisks(risksData.data.predictions || {});
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data
        setAiInsights([
          "Your blood pressure is within normal range. Keep up the good work!",
          "Consider increasing your daily steps to improve cardiovascular health.",
          "Your sleep pattern is excellent. Maintain consistency for better recovery.",
        ]);
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Blood Pressure (Systolic)",
        data: [118, 120, 122, 119, 121, 118, 120],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
      {
        label: "Heart Rate (BPM)",
        data: [68, 70, 72, 69, 71, 68, 70],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Health Trends",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const healthScoreData = {
    labels: ["Health Score", "Room for Improvement"],
    datasets: [
      {
        data: [healthScore, 100 - healthScore],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.2)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 0.5)"],
        borderWidth: 1,
      },
    ],
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
      <h1 className="text-3xl font-bold mb-8 text-primary">Welcome back, {user.displayName || user.email}!</h1>

      {/* Vitals Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaHeartbeat className="text-3xl text-danger mb-2 mx-auto" />
          <h3 className="text-lg font-semibold">Blood Pressure</h3>
          <p className="text-2xl font-bold text-primary">{vitals.bloodPressure}/80</p>
          <p className="text-sm text-gray-600">mmHg</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaHeartbeat className="text-3xl text-secondary mb-2 mx-auto" />
          <h3 className="text-lg font-semibold">Heart Rate</h3>
          <p className="text-2xl font-bold text-primary">{vitals.heartRate}</p>
          <p className="text-sm text-gray-600">BPM</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaWeight className="text-3xl text-accent mb-2 mx-auto" />
          <h3 className="text-lg font-semibold">Weight</h3>
          <p className="text-2xl font-bold text-primary">{vitals.weight}</p>
          <p className="text-sm text-gray-600">kg</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white p-6 rounded-lg shadow-lg text-center"
        >
          <FaWalking className="text-3xl text-primary mb-2 mx-auto" />
          <h3 className="text-lg font-semibold">Steps Today</h3>
          <p className="text-2xl font-bold text-primary">{vitals.steps.toLocaleString()}</p>
          <p className="text-sm text-gray-600">steps</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <Line data={chartData} options={chartOptions} />
        </motion.div>
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4 text-center">AI Health Score</h3>
          <Doughnut data={healthScoreData} />
          <p className="text-center mt-4 text-2xl font-bold text-primary">{healthScore}/100</p>
        </motion.div>
      </div>

      {/* AI Disease Risk Predictions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FaRobot className="mr-2 text-purple-500" />
          AI Disease Risk Assessment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(diseaseRisks).map(([disease, data]) => (
            <motion.div
              key={disease}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + Object.keys(diseaseRisks).indexOf(disease) * 0.1 }}
              className={`p-4 rounded-lg border ${
                data.risk_level === 'High' ? 'bg-red-50 border-red-200' :
                data.risk_level === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium capitalize">{disease.replace('_', ' ')}</h3>
                <span className="text-sm font-bold">{data.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    data.risk_level === 'High' ? 'bg-red-500' :
                    data.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${data.probability}%` }}
                ></div>
              </div>
              <p className={`text-xs font-medium ${
                data.risk_level === 'High' ? 'text-red-600' :
                data.risk_level === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>{data.risk_level} Risk</p>
              {data.recommendations && data.recommendations.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {data.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-0.5 mr-1 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FaBrain className="mr-2 text-accent" />
          AI Health Insights
        </h2>
        <div className="space-y-4">
          {aiInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-blue-50 p-4 rounded-lg border-l-4 border-primary"
            >
              <p className="text-gray-800">{insight}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/records'}
            className="bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Upload Medical Records
          </button>
          <button
            onClick={() => window.location.href = '/medicines'}
            className="bg-secondary text-white py-3 px-6 rounded-lg hover:bg-green-600 transition duration-300"
          >
            Manage Medications
          </button>
          <button
            onClick={() => window.location.href = '/chatbot'}
            className="bg-accent text-white py-3 px-6 rounded-lg hover:bg-yellow-600 transition duration-300"
          >
            Chat with AI Assistant
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
