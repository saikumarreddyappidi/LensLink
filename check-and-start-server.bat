@echo off
echo ===================================================
echo         LensLink Server Status Checker
echo ===================================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

echo.
echo [2/5] Checking project files...
if not exist "server.js" (
    echo ❌ server.js not found
    echo Make sure you're in the correct directory
    pause
    exit /b 1
) else (
    echo ✅ server.js found
)

if not exist ".env" (
    echo ❌ .env file not found
    echo Creating default .env file...
    echo NODE_ENV=development > .env
    echo PORT=3001 >> .env
    echo MONGODB_URI=mongodb://localhost:27017/lenslink >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo JWT_EXPIRE=30d >> .env
    echo FRONTEND_URL=http://localhost:3001 >> .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

echo.
echo [3/5] Checking if port 3001 is available...
netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3001 is in use
    echo This could be your server already running, or another application
    echo.
    echo Killing any existing Node.js processes...
    taskkill /f /im node.exe >nul 2>&1
    echo ✅ Cleared any existing Node.js processes
) else (
    echo ✅ Port 3001 is available
)

echo.
echo [4/5] Checking dependencies...
if not exist "node_modules" (
    echo ⚠️  node_modules not found, installing dependencies...
    echo This may take a few minutes...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    ) else (
        echo ✅ Dependencies installed successfully
    )
) else (
    echo ✅ Dependencies are installed
)

echo.
echo [5/5] All checks passed! Starting server...
echo ===================================================
echo.
echo Server starting on port 3001...
echo When you see "Server running on port 3001", the server is ready!
echo.
echo 🌐 Your website: http://localhost:3001
echo 📱 Registration page: http://localhost:3001/index.html
echo 🔧 Test tool: http://localhost:3001/fix-server-connection.html
echo.
echo Press Ctrl+C to stop the server
echo ===================================================
echo.

REM Start the server
node server.js

echo.
echo Server has stopped.
pause
