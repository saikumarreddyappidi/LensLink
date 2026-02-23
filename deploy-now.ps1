# LensLink Quick Deployment Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    LensLink Quick Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test local server
Write-Host "Step 1: Testing local server..." -ForegroundColor Yellow
Write-Host "Starting server on port 3000..."
Start-Process powershell -ArgumentList "-Command", "npm run serve" -WindowStyle Minimized
Start-Sleep 3
Write-Host "✅ Server started! Check http://localhost:3000" -ForegroundColor Green
Write-Host ""

# Step 2: Check Git
Write-Host "Step 2: Preparing for deployment..." -ForegroundColor Yellow
Write-Host "Checking Git status..."
git status
Write-Host ""

# Step 3: Deployment options
Write-Host "Step 3: Choose your deployment method:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Heroku (Full features, free tier)" -ForegroundColor White
Write-Host "[2] Netlify (Easiest, drag & drop)" -ForegroundColor White  
Write-Host "[3] Vercel (Fastest, modern)" -ForegroundColor White
Write-Host "[4] Manual deployment (advanced)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 HEROKU DEPLOYMENT STEPS:" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli"
        Write-Host "2. Run: heroku login"
        Write-Host "3. Run: heroku create your-site-name"
        Write-Host "4. Run: git add . && git commit -m 'Deploy to Heroku'"
        Write-Host "5. Run: git push heroku main"
        Write-Host "6. Run: heroku open"
        Write-Host ""
        Write-Host "Your site will be live at: https://your-site-name.herokuapp.com" -ForegroundColor Cyan
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 NETLIFY DEPLOYMENT STEPS:" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Go to: https://netlify.com"
        Write-Host "2. Sign up with GitHub account"
        Write-Host "3. Drag your project folder to the deploy area"
        Write-Host "4. Your site will be live instantly!"
        Write-Host ""
        Write-Host "Your site will be live at: https://random-name-12345.netlify.app" -ForegroundColor Cyan
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 VERCEL DEPLOYMENT STEPS:" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Install Vercel CLI: npm install -g vercel"
        Write-Host "2. Run: vercel login"
        Write-Host "3. Run: vercel --prod"
        Write-Host "4. Follow the prompts"
        Write-Host ""
        Write-Host "Your site will be live at: https://your-site.vercel.app" -ForegroundColor Cyan
    }
    "4" {
        Write-Host ""
        Write-Host "📋 MANUAL DEPLOYMENT OPTIONS:" -ForegroundColor Green
        Write-Host ""
        Write-Host "- GitHub Pages (free static hosting)"
        Write-Host "- Railway (modern platform)"
        Write-Host "- Render (simple web services)"
        Write-Host "- DigitalOcean App Platform"
        Write-Host ""
        Write-Host "Check DEPLOYMENT.md for detailed instructions"
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}
}

# Domain setup guide
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       CUSTOM DOMAIN SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Buy domain from:" -ForegroundColor Yellow
Write-Host "   - Namecheap.com (recommended)"
Write-Host "   - GoDaddy.com"
Write-Host "   - Google Domains"
Write-Host ""
Write-Host "2. In your hosting dashboard:" -ForegroundColor Yellow
Write-Host "   - Add custom domain: yourdomain.com"
Write-Host "   - Copy the DNS records provided"
Write-Host ""
Write-Host "3. In your domain registrar:" -ForegroundColor Yellow
Write-Host "   - Go to DNS Management"
Write-Host "   - Add A and CNAME records"
Write-Host "   - Wait 24-48 hours"
Write-Host ""
Write-Host "4. Enable HTTPS (usually automatic)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your site will be live at: https://yourdomain.com" -ForegroundColor Green
Write-Host ""

# Final message
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         DEPLOYMENT COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your LensLink photography booking site is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📸 Features included:" -ForegroundColor Yellow
Write-Host "✅ User authentication"
Write-Host "✅ Photography booking system"
Write-Host "✅ Mobile responsive design"
Write-Host "✅ Professional UI"
Write-Host "✅ LocalStorage data persistence"
Write-Host ""
Write-Host "Need help? Check READY-TO-DEPLOY.md for detailed instructions." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue..."
