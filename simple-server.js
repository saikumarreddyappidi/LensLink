// Simple Static Server for LensLink (No Database Required)
// This is perfect for deployment to static hosting services

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve index.html for all routes (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use environment PORT for deployment platforms
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LensLink running on port ${PORT}`);
  console.log(`🌐 Access your website at: http://localhost:${PORT}`);
  console.log(`📱 Mobile friendly and ready for deployment!`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
