import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaPills, FaClock, FaTrash, FaEdit, FaBell, FaCheckCircle, FaExclamationTriangle, FaChartLine } from "react-icons/fa";

const MedicineManagement = ({ user }) => {
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brandName: "",
    dosage: { amount: "", unit: "mg" },
    frequency: {
      timesPerDay: 1,
      specificTimes: ["08:00"],
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    duration: { startDate: "", endDate: "", durationDays: 30 },
    instructions: { howToTake: "", withFood: "with", specialInstructions: "" },
    inventory: {
      currentStock: 0,
      lowStockThreshold: 7,
      autoReorder: false,
      reorderPoint: 5,
      supplier: ""
    },
    reminders: { enabled: true, advanceNotice: 15, missedDoseAlert: true },
    category: "prescription",
    tags: []
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medicines`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMedicines(data.data.medicines || []);
        }
      } catch (error) {
        console.error('Error fetching medicines:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMedicines();
    }
  }, [user]);

  useEffect(() => {
    // Check for low stock and send reminders
    medicines.forEach(medicine => {
      if (medicine.stock <= medicine.lowStockThreshold) {
        // In a real app, trigger notification
        console.log(`Low stock alert for ${medicine.name}`);
      }
    });
  }, [medicines]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addMedicine = async () => {
    if (formData.name && formData.dosage && formData.time) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medicines`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setMedicines(prev => [...prev, data.data.medicine]);
          resetForm();
          alert("Medicine added successfully!");
        } else {
          throw new Error('Add failed');
        }
      } catch (error) {
        console.error('Error adding medicine:', error);
        alert("Error adding medicine. Please try again.");
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const updateMedicine = async () => {
    if (formData.name && formData.dosage && formData.time) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medicines/${editingMedicine.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setMedicines(medicines.map(med =>
            med.id === editingMedicine.id ? data.data.medicine : med
          ));
          resetForm();
          alert("Medicine updated successfully!");
        } else {
          throw new Error('Update failed');
        }
      } catch (error) {
        console.error('Error updating medicine:', error);
        alert("Error updating medicine. Please try again.");
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const deleteMedicine = async (id) => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medicines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (response.ok) {
        setMedicines(medicines.filter(medicine => medicine.id !== id));
        alert("Medicine deleted successfully!");
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert("Error deleting medicine. Please try again.");
    }
  };

  const editMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setFormData(medicine);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      time: "",
      frequency: "daily",
      duration: "",
      reminders: true,
      stock: 0,
      lowStockThreshold: 10,
    });
    setEditingMedicine(null);
    setShowForm(false);
  };

  const autoReorder = (medicine) => {
    // In a real app, integrate with pharmacy API
    alert(`Auto-reorder initiated for ${medicine.name}. Integration with pharmacy API needed.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Medicine Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Medicine
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Medicine Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dosage *</label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                placeholder="e.g., 100mg, 2 tablets"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="twice daily">Twice Daily</option>
                <option value="three times daily">Three Times Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as needed">As Needed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 30 days, ongoing"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Low Stock Alert Threshold</label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="reminders"
                checked={formData.reminders}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Enable Reminders</label>
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={editingMedicine ? updateMedicine : addMedicine}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Medicine List */}
      <div className="grid gap-6">
        {medicines.map((medicine) => (
          <motion.div
            key={medicine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FaPills className="text-primary mr-2" />
                  <h3 className="text-xl font-semibold">{medicine.name}</h3>
                  {medicine.stock <= medicine.lowStockThreshold && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Dosage:</span> {medicine.dosage}
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-1 text-gray-500" />
                    <span className="font-medium">Time:</span> {medicine.time}
                  </div>
                  <div>
                    <span className="font-medium">Frequency:</span> {medicine.frequency}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {medicine.duration}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Stock:</span> {medicine.stock} tablets
                  {medicine.reminders && (
                    <span className="ml-2 text-green-600 flex items-center">
                      <FaBell className="mr-1" size={12} />
                      Reminders On
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => editMedicine(medicine)}
                  className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-300"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteMedicine(medicine.id)}
                  className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-300"
                  title="Delete"
                >
                  <FaTrash />
                </button>
                {medicine.stock <= medicine.lowStockThreshold && (
                  <button
                    onClick={() => autoReorder(medicine)}
                    className="bg-accent text-white p-2 rounded-md hover:bg-yellow-600 transition duration-300"
                    title="Auto Reorder"
                  >
                    Reorder
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {medicines.length === 0 && (
        <div className="text-center py-12">
          <FaPills className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No medicines added yet.</p>
          <p className="text-gray-500">Click "Add Medicine" to get started.</p>
        </div>
      )}
    </motion.div>
  );
};

export default MedicineManagement;
