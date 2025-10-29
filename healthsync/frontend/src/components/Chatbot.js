import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRobot, FaUser, FaPaperPlane, FaTimes } from "react-icons/fa";

const Chatbot = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hello ${user?.displayName || 'there'}! I'm your AI health assistant. I can help you with health questions, medication reminders, symptom analysis, and general wellness advice. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      sender: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      // Use backend AI API instead of direct OpenAI call
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: currentInput,
          context: "health_assistance",
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.data.response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling AI API:", error);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I'm having trouble connecting right now. Please try again later or consult with a healthcare professional for medical advice.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: `Hello ${user?.displayName || 'there'}! I'm your AI health assistant. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <FaRobot className="mr-3" />
          AI Health Assistant
        </h1>
        <button
          onClick={clearChat}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300 flex items-center"
        >
          <FaTimes className="mr-2" />
          Clear Chat
        </button>
      </div>

      {/* Chat Container */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: msg.sender === "user" ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex items-center mb-1">
                  {msg.sender === "user" ? (
                    <FaUser className="mr-2 text-xs" />
                  ) : (
                    <FaRobot className="mr-2 text-xs" />
                  )}
                  <span className="text-xs font-medium">
                    {msg.sender === "user" ? "You" : "HealthBot"}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <FaRobot className="mr-2 text-xs" />
                  <span className="text-xs font-medium">HealthBot</span>
                </div>
                <div className="flex space-x-1 mt-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your health, medications, or wellness..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaPaperPlane />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This AI assistant provides general health information. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </motion.div>

      {/* Quick Suggestions */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white p-4 rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-3">Quick Questions:</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {[
            "How can I improve my sleep?",
            "What are healthy blood pressure ranges?",
            "Tips for managing stress",
            "How often should I exercise?",
            "What foods are good for heart health?",
            "When should I see a doctor?"
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => setInput(question)}
              className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition duration-300 text-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Chatbot;
