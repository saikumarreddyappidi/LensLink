#!/bin/bash
echo "� Starting LensLink Backend on Railway..."
echo "📁 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo "🔍 Node version: $(node --version)"
echo "🔍 NPM version: $(npm --version)"

echo "🔍 Checking backend directory..."
if [ -d "backend" ]; then
    echo "✅ Backend directory found"
    cd backend
    echo "📁 Backend directory contents:"
    ls -la
    
    echo "📦 Installing dependencies..."
    npm install --production
    
    echo "🎯 Starting server..."
    exec node server.js
else
    echo "❌ Backend directory not found!"
    echo "📂 Current directory contents:"
    ls -la
    exit 1
fi