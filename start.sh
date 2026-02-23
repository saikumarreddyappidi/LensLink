#!/bin/bash

# LensLink Backend Startup Script for Railway

echo "🚀 Starting LensLink Backend..."

# Navigate to backend directory
cd backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌐 Starting server..."
node server.js
