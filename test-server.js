// Quick server test script
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!', port: PORT });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working!',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test it at: http://localhost:${PORT}/test`);
}).on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
});
