const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// Security middleware configuration
const securityMiddleware = (app) => {
  // Use Helmet to set various HTTP headers for security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://identitytoolkit.googleapis.com"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // Enable CORS with specific options
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || false
      : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  app.use(cors(corsOptions));

  // Rate limiting - temporarily disabled for testing
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // limit each IP to 100 requests per windowMs
  //   message: {
  //     success: false,
  //     message: 'Too many requests from this IP, please try again later.'
  //   },
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // });
  // app.use('/api/', limiter);

  // Stricter rate limiting for auth routes - temporarily disabled for testing
  // const authLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 1000, // limit each IP to 1000 auth requests per windowMs (increased for testing)
  //   message: {
  //     success: false,
  //     message: 'Too many authentication attempts, please try again later.'
  //   },
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // });
  // app.use('/api/auth/', authLimiter);

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: ['role', 'limit', 'skip', 'sort'] // Allow certain parameters to be duplicated
  }));

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  return app;
};

module.exports = securityMiddleware;
