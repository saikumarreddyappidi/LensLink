@echo off
cls
color 0A
echo.
echo ╔══════════════════════════════════════════════════echo 🚀 Starting LensLink server on port 3000...
echo.
echo ⭐ IMPORTANT: Keep this window open while using the website!
echo.
echo 🌐 Once started, open your browser and go to:
echo    👉 http://localhost:3000/index.html══════╗
echo ║                    🚀 LENSLINK SERVER STARTER               ║
echo ║                        Fix Connection Error                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the correct directory
if not exist "server.js" (
    echo ❌ ERROR: server.js not found!
    echo.
    echo Please make sure you're running this from:
    echo c:\Users\saiku\OneDrive\Desktop\shutter
    echo.
    pause
    exit /b 1
)

echo ✅ Found server.js - We're in the correct directory
echo.

REM Check Node.js
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installation, restart this script.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Kill any existing Node processes to prevent port conflicts
echo 🔄 Stopping any existing servers...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ Cleared existing processes
echo.

REM Check if dependencies are installed
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo ⚠️  Installing dependencies... This may take a few minutes.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo.
        echo Try running this command manually:
        echo npm install
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully!
) else (
    echo ✅ Dependencies already installed
)
echo.

REM Check/create .env file
echo ⚙️  Checking configuration...
if not exist ".env" (
    echo Creating .env configuration file...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo MONGODB_URI=mongodb://localhost:27017/lenslink
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRE=30d
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo ✅ Configuration file created
) else (
    echo ✅ Configuration file exists
)
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        🎉 READY TO START!                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Starting LensLink server on port 3001...
echo.
echo ⭐ IMPORTANT: Keep this window open while using the website!
echo.
echo 🌐 Once started, open your browser and go to:
echo    👉 http://localhost:3001/index.html
echo.
echo 🛑 To stop the server: Press Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Start the server
node server.js

echo.
echo ℹ️  Server has stopped.
echo Press any key to exit...
pause >nul
