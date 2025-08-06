# LensLink Server Starter
Write-Host "=== LensLink Photography Booking Platform ===" -ForegroundColor Cyan
Write-Host "Starting server setup..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js installation
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    try {
        & npm install
        Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install dependencies." -ForegroundColor Red
        Write-Host "Try running this command manually in Command Prompt: npm install" -ForegroundColor Yellow
        Read-Host "Press Enter to continue anyway"
    }
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting LensLink server..." -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    & node server.js
} catch {
    Write-Host "✗ Failed to start server. Check the error messages above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
