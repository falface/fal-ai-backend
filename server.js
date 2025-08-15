// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Routes
const notificationRoutes = require('./routes/notifications');
const { initializeFirebase } = require('./utils/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - Android emulator ve local development için
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://10.0.2.2:3000',
    'http://127.0.0.1:3000',
    process.env.CORS_ORIGIN || '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`${timestamp} - ${method} ${url} - IP: ${ip}`);
  next();
});

// Initialize Firebase
try {
  initializeFirebase();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
}

// Routes
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fal AI Notification Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      apiHealth: 'GET /api/notifications/health',
      adminAnnouncement: 'POST /api/notifications/admin',
      promotion: 'POST /api/notifications/promotion',
      fortuneReady: 'POST /api/notifications/fortune',
      userNotification: 'POST /api/notifications/user',
      test: 'POST /api/notifications/test'
    },
    authentication: 'API Key required in x-api-key header for protected routes',
    documentation: 'https://github.com/your-repo/fal-ai-backend'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Fal AI Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/notifications/health',
      'POST /api/notifications/admin',
      'POST /api/notifications/promotion',
      'POST /api/notifications/fortune',
      'POST /api/notifications/user',
      'POST /api/notifications/test'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💀 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💀 Process terminated');
    process.exit(0);
  });
});

// Start server - Tüm network interface'lerde dinle (0.0.0.0)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 =================================');
  console.log(`🚀 Fal AI Notification Backend`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 API Key: ${process.env.API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('🚀 =================================');
  console.log(`📱 Local: http://localhost:${PORT}/health`);
  console.log(`📱 Network: http://0.0.0.0:${PORT}/health`);
  console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}/health`);
  console.log('🚀 =================================');
  
  // Test Firebase connection
  console.log('🔥 Testing Firebase connection...');
  setTimeout(() => {
    console.log('✅ Firebase Admin SDK ready');
  }, 1000);
});

module.exports = app;