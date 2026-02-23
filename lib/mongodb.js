/**
 * lib/mongodb.js
 * ─────────────────────────────────────────────────────────
 * Cached Mongoose connection helper.
 * Re-uses an existing connection across requests so we
 * don't open a new connection on every hot-reload or
 * serverless invocation.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lenslink';

// Module-level cache so the connection survives across
// require() calls in the same process.
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/**
 * Returns a ready Mongoose connection.
 * Call this at the top of any route handler that needs DB access.
 */
async function connectDB() {
  // Already connected - return immediately
  if (cached.conn) {
    return cached.conn;
  }

  // Connection in progress - await the pending promise
  if (!cached.promise) {
    const options = {
      // Kept minimal; Mongoose 7+ sets sane defaults
      serverSelectionTimeoutMS: 10000, // fail fast in development
    };

    console.log('🔌 Connecting to MongoDB:', MONGODB_URI);

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((err) => {
        // Clear the promise so the next call retries
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
