@echo off
echo Starting LensLink Photography Booking Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not available
    echo Please install Node.js which includes npm
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

REM Check if .env file exists, if not create a basic one
if not exist ".env" (
    echo Creating .env file...
    echo NODE_ENV=development > .env
    echo PORT=3001 >> .env
    echo MONGODB_URI=mongodb://localhost:27017/lenslink >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo JWT_EXPIRE=30d >> .env
    echo FRONTEND_URL=http://localhost:3001 >> .env
    echo .env file created with default settings
    echo.
)

REM Start the server
echo Starting server on port 3001...
echo Server will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.
node server.js
