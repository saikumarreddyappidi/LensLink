#!/bin/bash
echo "🚂 Railway Build Debug Script"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la
echo "Files in backend directory:"
ls -la backend/
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Installing backend dependencies..."
cd backend
npm install --production
echo "✅ Dependencies installed successfully"
echo "Starting server..."
npm start