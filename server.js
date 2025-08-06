const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const photographerRoutes = require('./routes/photographers');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (including your index.html)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photographers', photographerRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('⚠️  No MongoDB URI provided - running in localStorage mode');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Continuing without database - using localStorage mode');
  }
};

// Connect to database and start server
// Use environment PORT for deployment platforms (Heroku, Railway, etc.) or default to 3000 for local development
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}/api`);
    console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
