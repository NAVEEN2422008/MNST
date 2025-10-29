import React from 'react';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaBrain, FaShieldAlt, FaUsers } from 'react-icons/fa';

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-br from-primary to-secondary text-white rounded-lg mb-12">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold mb-4"
        >
          About HealthSync+
        </motion.h1>
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl max-w-3xl mx-auto"
        >
          Revolutionizing healthcare with AI-powered insights, seamless integration, and user-centric design.
        </motion.p>
      </section>

      {/* Mission Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Our Mission</h2>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-center leading-relaxed">
            At HealthSync+, we believe that everyone deserves access to personalized, intelligent healthcare management.
            Our platform combines cutting-edge AI technology with intuitive design to empower users to take control of their health,
            connect seamlessly with healthcare providers, and make informed decisions about their well-being.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">What Makes Us Different</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-lg shadow-lg text-center"
          >
            <FaBrain className="text-4xl text-accent mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
            <p>Advanced machine learning algorithms provide personalized health predictions and recommendations.</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-lg shadow-lg text-center"
          >
            <FaShieldAlt className="text-4xl text-secondary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p>Bank-level encryption and HIPAA compliance ensure your health data remains confidential.</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-lg shadow-lg text-center"
          >
            <FaUsers className="text-4xl text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Integrated Care</h3>
            <p>Seamlessly connect with doctors, hospitals, and pharmacies for comprehensive care.</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-lg shadow-lg text-center"
          >
            <FaHeartbeat className="text-4xl text-danger mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
            <p>Track vital signs, medications, and health metrics in real-time with smart notifications.</p>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">Technology Stack</h2>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">Frontend</h3>
              <ul className="space-y-2">
                <li><strong>React.js:</strong> Modern, component-based UI framework</li>
                <li><strong>Tailwind CSS:</strong> Utility-first CSS framework for responsive design</li>
                <li><strong>Framer Motion:</strong> Smooth animations and transitions</li>
                <li><strong>Chart.js:</strong> Interactive data visualizations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary">Backend & AI</h3>
              <ul className="space-y-2">
                <li><strong>Node.js/Express:</strong> Scalable server-side framework</li>
                <li><strong>MongoDB:</strong> Flexible NoSQL database</li>
                <li><strong>TensorFlow:</strong> Machine learning for health predictions</li>
                <li><strong>Firebase:</strong> Authentication and cloud storage</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-3xl font-bold mb-4 text-primary">Created by Naveen Kumar</h2>
          <p className="text-lg mb-6">
            Passionate about leveraging technology to improve healthcare accessibility and outcomes.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="#"
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600 transition duration-300"
            >
              View Portfolio
            </a>
            <a
              href="#"
              className="border-2 border-primary text-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition duration-300"
            >
              Contact Me
            </a>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default About;
