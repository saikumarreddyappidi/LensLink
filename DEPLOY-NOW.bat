@echo off
echo ========================================
echo    LensLink Quick Deployment Script
echo ========================================
echo.

echo Step 1: Testing local server...
echo Starting server on port 3000...
start /min cmd /c "npm run serve"
timeout /t 3 >nul
echo ✅ Server started! Check http://localhost:3000
echo.

echo Step 2: Preparing for deployment...
echo Checking Git status...
git status
echo.

echo Step 3: Choose your deployment method:
echo.
echo [1] Heroku (Full features, free tier)
echo [2] Netlify (Easiest, drag & drop)
echo [3] Vercel (Fastest, modern)
echo [4] Manual deployment (advanced)
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto heroku
if "%choice%"=="2" goto netlify
if "%choice%"=="3" goto vercel
if "%choice%"=="4" goto manual
goto end

:heroku
echo.
echo 🚀 HEROKU DEPLOYMENT STEPS:
echo.
echo 1. Install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli
echo 2. Run: heroku login
echo 3. Run: heroku create your-site-name
echo 4. Run: git add . && git commit -m "Deploy to Heroku"
echo 5. Run: git push heroku main
echo 6. Run: heroku open
echo.
echo Your site will be live at: https://your-site-name.herokuapp.com
goto domain

:netlify
echo.
echo 🚀 NETLIFY DEPLOYMENT STEPS:
echo.
echo 1. Go to: https://netlify.com
echo 2. Sign up with GitHub account
echo 3. Drag your project folder to the deploy area
echo 4. Your site will be live instantly!
echo.
echo Your site will be live at: https://random-name-12345.netlify.app
goto domain

:vercel
echo.
echo 🚀 VERCEL DEPLOYMENT STEPS:
echo.
echo 1. Install Vercel CLI: npm install -g vercel
echo 2. Run: vercel login
echo 3. Run: vercel --prod
echo 4. Follow the prompts
echo.
echo Your site will be live at: https://your-site.vercel.app
goto domain

:manual
echo.
echo 📋 MANUAL DEPLOYMENT OPTIONS:
echo.
echo - GitHub Pages (free static hosting)
echo - Railway (modern platform)
echo - Render (simple web services)
echo - DigitalOcean App Platform
echo.
echo Check DEPLOYMENT.md for detailed instructions
goto domain

:domain
echo.
echo ========================================
echo       CUSTOM DOMAIN SETUP
echo ========================================
echo.
echo 1. Buy domain from:
echo    - Namecheap.com (recommended)
echo    - GoDaddy.com
echo    - Google Domains
echo.
echo 2. In your hosting dashboard:
echo    - Add custom domain: yourdomain.com
echo    - Copy the DNS records provided
echo.
echo 3. In your domain registrar:
echo    - Go to DNS Management
echo    - Add A and CNAME records
echo    - Wait 24-48 hours
echo.
echo 4. Enable HTTPS (usually automatic)
echo.
echo Your site will be live at: https://yourdomain.com
echo.

:end
echo ========================================
echo         DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your LensLink photography booking site is ready!
echo.
echo 📸 Features included:
echo ✅ User authentication
echo ✅ Photography booking system
echo ✅ Mobile responsive design
echo ✅ Professional UI
echo ✅ LocalStorage data persistence
echo.
echo Need help? Check READY-TO-DEPLOY.md for detailed instructions.
echo.
pause
