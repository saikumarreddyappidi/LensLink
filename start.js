#!/usr/bin/env node

// Simple Node.js startup script for Railway
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting LensLink Backend...');
console.log('📁 Current directory:', process.cwd());
console.log('📂 Starting server from backend directory...');

// Change to backend directory and start server
process.chdir(path.join(__dirname, 'backend'));
console.log('📁 Changed to directory:', process.cwd());

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, 'backend')
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`🔄 Server process exited with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('📡 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
});