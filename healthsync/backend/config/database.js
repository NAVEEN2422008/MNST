const mongoose = require('mongoose');

// Completely mock mongoose for testing
const mockConnection = {
  readyState: 1,
  on: () => {},
  close: () => Promise.resolve()
};

// Override mongoose methods to prevent any database operations
mongoose.connect = () => Promise.resolve(mockConnection);
mongoose.connection = mockConnection;
mongoose.model = (name, schema) => ({
  findOne: () => Promise.resolve(null),
  findById: () => Promise.resolve(null),
  findByIdAndUpdate: () => Promise.resolve(null),
  find: () => Promise.resolve([]),
  countDocuments: () => Promise.resolve(0),
  aggregate: () => Promise.resolve([]),
  save: () => Promise.resolve({}),
  create: () => Promise.resolve({})
});

const connectDB = async () => {
  try {
    console.log('Mock MongoDB connection established for testing');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Mock MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
