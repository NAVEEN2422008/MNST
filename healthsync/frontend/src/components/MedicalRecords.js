import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaFileAlt, FaEye, FaDownload, FaTrash } from "react-icons/fa";

const MedicalRecords = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };



  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medical-records`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRecords(data.data.records || []);
        }
      } catch (error) {
        console.error('Error fetching medical records:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecords();
    }
  }, [user]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);
    setExtracting(true);

    try {
      const idToken = await user.getIdToken();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', `Medical Record - ${new Date().toLocaleDateString()}`);
      formData.append('description', 'Uploaded via OCR processing');
      formData.append('recordType', file.type.startsWith('image/') ? 'scan' : 'document');
      formData.append('date', new Date().toISOString().split('T')[0]);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medical-records/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setRecords(prev => [...prev, data.data.record]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("File uploaded and analyzed successfully!");
    } catch (error) {
      console.error('Error uploading file:', error);
      alert("Error uploading file. Please try again.");
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/medical-records/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (response.ok) {
        setRecords(records.filter(record => record.id !== id));
        alert("Record deleted successfully!");
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert("Error deleting record. Please try again.");
    }
  };

  const viewRecord = (record) => {
    setSelectedRecord(record);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-8 text-primary">Medical Records</h1>

      {/* Upload Section */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaUpload className="mr-2 text-primary" />
          Upload New Record
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                {extracting ? 'Analyzing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Supported formats: PDF, JPG, PNG. AI will automatically extract health data from images.
        </p>
      </motion.div>

      {/* Records List */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaFileAlt className="mr-2 text-primary" />
          Your Medical Records
        </h2>
        {records.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No records uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{record.name}</h3>
                    <p className="text-sm text-gray-600">Uploaded on {record.date}</p>
                    <p className="text-sm text-primary font-medium">{record.type}</p>
                    {record.extractedData && Object.keys(record.extractedData).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-secondary">Extracted Data:</p>
                        <ul className="text-sm text-gray-700 ml-4">
                          {Object.entries(record.extractedData).map(([key, value]) => (
                            <li key={key} className="capitalize">{key}: {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewRecord(record)}
                      className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-300"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => alert('Download functionality would be implemented here')}
                      className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition duration-300"
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-300"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedRecord(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">{selectedRecord.name}</h3>
            <div className="space-y-2">
              <p><strong>Type:</strong> {selectedRecord.type}</p>
              <p><strong>Upload Date:</strong> {selectedRecord.date}</p>
              {selectedRecord.extractedData && Object.keys(selectedRecord.extractedData).length > 0 && (
                <div>
                  <p className="font-semibold">Extracted Health Data:</p>
                  <ul className="ml-4">
                    {Object.entries(selectedRecord.extractedData).map(([key, value]) => (
                      <li key={key} className="capitalize">{key}: {value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MedicalRecords;
