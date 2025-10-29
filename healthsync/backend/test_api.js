const http = require('http');

const testAuth = () => {
  const data = JSON.stringify({
    firebaseToken: 'test-token',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'patient',
    phoneNumber: '+1234567890',
    profile: {
      age: 30,
      gender: 'male',
      height: 175,
      weight: 70
    },
    medicalInfo: {
      conditions: ['Hypertension'],
      allergies: ['Penicillin']
    }
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/firebase-auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      if (res.statusCode === 200) {
        const response = JSON.parse(body);
        console.log('✅ Authentication successful');
        testProfileAPI(response.data.token);
      } else {
        console.log('❌ Auth failed, trying direct medicine API test');
        testMedicineDirect();
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(data);
  req.end();
};

const testProfileAPI = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Profile API Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);

      if (res.statusCode === 200) {
        console.log('✅ Profile API successful');
        testAIInsights(token);
      } else {
        console.log('❌ Profile API failed');
        testMedicineDirect();
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
};

const testAIInsights = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/insights/health',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- AI Insights API Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      testDiseaseRisks(token);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
};

const testDiseaseRisks = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/predictions/disease-risk',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- AI Disease Risk Predictions API Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      testMedicineManagement(token);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
};

const testMedicineManagement = (token) => {
  console.log('\n--- Testing Medicine Management APIs ---');

  // Test creating a medicine
  const createMedicineData = JSON.stringify({
    name: "Test Medicine",
    genericName: "Test Generic",
    brandName: "Test Brand",
    dosage: { amount: 100, unit: "mg" },
    frequency: {
      timesPerDay: 2,
      specificTimes: ["08:00", "20:00"],
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    duration: { startDate: new Date().toISOString(), durationDays: 30 },
    instructions: { howToTake: "Take with food", withFood: "with" },
    inventory: {
      currentStock: 30,
      lowStockThreshold: 7,
      autoReorder: true,
      reorderPoint: 5,
      supplier: "Test Pharmacy"
    },
    reminders: { enabled: true, advanceNotice: 15, missedDoseAlert: true },
    category: "prescription"
  });

  const createOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(createMedicineData)
    }
  };

  const createReq = http.request(createOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Create Medicine Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);

      if (res.statusCode === 201) {
        const response = JSON.parse(body);
        const medicineId = response.data.medicine._id;
        testGetMedicines(token, medicineId);
      } else {
        console.log('\n--- Testing Complete ---');
      }
    });
  });

  createReq.on('error', (e) => {
    console.error('Error creating medicine:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  createReq.write(createMedicineData);
  createReq.end();
};

const testGetMedicines = (token, medicineId) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Get Medicines Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      testMedicineAdherence(token, medicineId);
    });
  });

  req.on('error', (e) => {
    console.error('Error getting medicines:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  req.end();
};

const testMedicineAdherence = (token, medicineId) => {
  const adherenceData = JSON.stringify({
    taken: true,
    takenAt: new Date().toISOString(),
    sideEffects: "None"
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/medicines/${medicineId}/adherence`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(adherenceData)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Log Medicine Adherence Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      testMedicineStats(token);
    });
  });

  req.on('error', (e) => {
    console.error('Error logging adherence:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  req.write(adherenceData);
  req.end();
};

const testMedicineStats = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stats/overview',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Medicine Statistics Test ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
      console.log('\n--- Medicine Management Testing Complete ---');
      console.log('\n--- Testing Complete ---');
    });
  });

  req.on('error', (e) => {
    console.error('Error getting medicine stats:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  req.end();
};

const testMedicineDirect = () => {
  console.log('\n--- Testing Medicine Management APIs (Direct) ---');

  // Test creating a medicine without auth (for testing purposes)
  const createMedicineData = JSON.stringify({
    name: "Test Medicine",
    genericName: "Test Generic",
    brandName: "Test Brand",
    dosage: { amount: 100, unit: "mg" },
    frequency: {
      timesPerDay: 2,
      specificTimes: ["08:00", "20:00"],
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    duration: { startDate: new Date().toISOString(), durationDays: 30 },
    instructions: { howToTake: "Take with food", withFood: "with" },
    inventory: {
      currentStock: 30,
      lowStockThreshold: 7,
      autoReorder: true,
      reorderPoint: 5,
      supplier: "Test Pharmacy"
    },
    reminders: { enabled: true, advanceNotice: 15, missedDoseAlert: true },
    category: "prescription"
  });

  const createOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(createMedicineData)
    }
  };

  const createReq = http.request(createOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Create Medicine Test (Direct) ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);

      if (res.statusCode === 201) {
        console.log('✅ Medicine creation successful');
        testGetMedicinesDirect();
      } else {
        console.log('❌ Medicine creation failed');
        console.log('\n--- Medicine Management Testing Complete ---');
        console.log('\n--- Testing Complete ---');
      }
    });
  });

  createReq.on('error', (e) => {
    console.error('Error creating medicine:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  createReq.write(createMedicineData);
  createReq.end();
};

const testGetMedicinesDirect = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Get Medicines Test (Direct) ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);

      if (res.statusCode === 200) {
        console.log('✅ Get medicines successful');
        testMedicineStatsDirect();
      } else {
        console.log('❌ Get medicines failed');
        console.log('\n--- Medicine Management Testing Complete ---');
        console.log('\n--- Testing Complete ---');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error getting medicines:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  req.end();
};

const testMedicineStatsDirect = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stats/overview',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('\n--- Medicine Statistics Test (Direct) ---');
      console.log('Status:', res.statusCode);
      console.log('Response:', body);

      if (res.statusCode === 200) {
        console.log('✅ Medicine statistics successful');
      } else {
        console.log('❌ Medicine statistics failed');
      }

      console.log('\n--- Medicine Management Testing Complete ---');
      console.log('\n--- Testing Complete ---');
    });
  });

  req.on('error', (e) => {
    console.error('Error getting medicine stats:', e.message);
    console.log('\n--- Testing Complete ---');
  });

  req.end();
};

console.log('--- Starting API Tests ---');
testAuth();
