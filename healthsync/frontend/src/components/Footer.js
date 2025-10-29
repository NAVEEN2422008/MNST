import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-primary text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">HealthSync+</h3>
            <p className="text-sm">
              Your AI-powered healthcare companion for better health management.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-accent transition duration-300">About Us</a></li>
              <li><a href="/dashboard" className="hover:text-accent transition duration-300">Dashboard</a></li>
              <li><a href="/chatbot" className="hover:text-accent transition duration-300">AI Assistant</a></li>
              <li><a href="/settings" className="hover:text-accent transition duration-300">Settings</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-accent transition duration-300">Help Center</a></li>
              <li><a href="#" className="hover:text-accent transition duration-300">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent transition duration-300">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent transition duration-300">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-accent transition duration-300">
                <FaGithub size={20} />
              </a>
              <a href="#" className="hover:text-accent transition duration-300">
                <FaLinkedin size={20} />
              </a>
              <a href="#" className="hover:text-accent transition duration-300">
                <FaTwitter size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-sm">
            &copy; 2025 HealthSync+. Created by Naveen Kumar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
