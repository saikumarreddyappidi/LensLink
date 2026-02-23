/**
 * server.js  –  LensLink Full-Stack Server
 * ─────────────────────────────────────────────────────────
 * Stack : Node.js + Express + MongoDB (Mongoose) + Nodemailer
 *
 * Start   : node server.js          (production)
 *           nodemon server.js       (development)
 *
 * .env keys required
 *   MONGODB_URI          – e.g. mongodb://localhost:27017/lenslink
 *   JWT_SECRET           – random secret string
 *   GMAIL_USER           – your Gmail address
 *   GMAIL_APP_PASSWORD   – Gmail App Password (not account password)
 *   ADMIN_EMAIL          – receives feedback alerts
 *   APP_URL              – public base URL for email links
 */

require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan    = require('morgan');
const path      = require('path');

// ── MongoDB cached connection ─────────────────────────────
const connectDB = require('./lib/mongodb');

// ── Route modules ─────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const photographerRoutes = require('./routes/photographers');
const bookingRoutes      = require('./routes/bookings');
const feedbackRoutes     = require('./routes/feedback');
const adminRoutes        = require('./routes/admin');

// ── App setup ─────────────────────────────────────────────
const app = express();

// Security headers  (relax CSP slightly so Tailwind CDN works)
app.use(
  helmet({
    contentSecurityPolicy: false, // index.html loads scripts from CDN
  })
);

// HTTP request logger (skip in test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting  (1 000 req / 15 min per IP — generous for dev/single-user)
const limiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 1000,
  standardHeaders: true,
  legacyHeaders  : false,
  skip: (req) => req.path === '/api/health', // never rate-limit the health check
});
app.use(limiter);

// CORS  – allow Railway domain, custom domain, and localhost
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin SPA)
      if (!origin) return callback(null, true);
      // Allow any Railway subdomain
      if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app')) return callback(null, true);
      // Allow configured frontend URL
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
      // Allow localhost for dev
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true);
      callback(null, true); // open – restrict further via FRONTEND_URL env var if needed
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files – serve index.html + all assets from project root
app.use(express.static(path.join(__dirname)));

// ── Health endpoint ───────────────────────────────────────
/**
 * GET /api/health
 * Used by the frontend to detect whether the backend is alive.
 * Returns MongoDB connection state so the UI can show the correct badge.
 */
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.status(200).json({
    success   : true,
    status    : 'ok',
    db        : dbStatus,
    timestamp : new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/photographers', photographerRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/admin',         adminRoutes);

// ── Catch-all: serve index.html for SPA routing ───────────
// Must come AFTER all /api routes so API 404s still return JSON.
app.get('*', (req, res) => {
  // If it's an API path we missed, return JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Global error handler ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success : false,
    message : err.message || 'Internal server error',
    error   : process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ── Bootstrap ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Start HTTP server immediately so Railway health checks can reach /api/health
// even while MongoDB is still connecting.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log(`║  🚀 LensLink server running             ║`);
  console.log(`║  🌐 http://localhost:${PORT}               ║`);
  console.log(`║  📡 API  http://localhost:${PORT}/api       ║`);
  console.log(`║  ⏳ Connecting to MongoDB...            ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received – shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log('✅ Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Connect to MongoDB and seed admin in the background (non-blocking)
(async () => {
  try {
    await connectDB();
    console.log('🗄️  MongoDB connected successfully');

    // ── Auto-seed admin account ────────────────────────────
    const User = require('./models/User');
    const adminEmail  = process.env.ADMIN_EMAIL    || 'saikumarreddyappidi9@gmail.com';
    const adminPass   = process.env.ADMIN_PASSWORD || 'Admin@LensLink2026';
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        name      : 'Admin',
        email     : adminEmail,
        password  : adminPass,
        role      : 'admin',
        isVerified: true,
        isActive  : true,
      });
      console.log(`👑 Admin account created → ${adminEmail}`);
      console.log(`🔑 Admin password        → ${adminPass}`);
    }
  } catch (err) {
    // Log the error but do NOT exit — let Railway see the server is alive.
    // Requests needing DB will fail with 503 until DB reconnects.
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('⚠️  Server will keep running; DB-dependent routes will return errors.');
    // Retry connection every 30 seconds
    setInterval(async () => {
      try {
        await connectDB();
        console.log('✅ MongoDB reconnected successfully');
      } catch (retryErr) {
        console.error('🔄 MongoDB retry failed:', retryErr.message);
      }
    }, 30000);
  }
})();

module.exports = app; // for testing

