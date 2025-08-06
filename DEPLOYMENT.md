# Deployment Guide - LensLink Photography Platform

## Port Configuration
Your server is now configured to use environment-based ports for different deployment scenarios:

- **Local Development**: Port 3000 (default)
- **Production**: Uses `process.env.PORT` (provided by hosting platform)
- **Custom**: Set `PORT=your_port_number` in your environment variables

## Deployment Options

### 1. Heroku (Recommended for beginners)
```bash
# Install Heroku CLI first, then:
heroku create your-lenslink-app
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_connection_string
heroku config:set JWT_SECRET=your_secure_jwt_secret
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 2. Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### 3. Render
1. Connect your GitHub repository to Render
2. Choose "Web Service"
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### 4. Vercel (Static + Serverless)
```bash
npm install -g vercel
vercel --prod
```

### 5. Netlify (Static hosting)
1. Build command: `npm run build`
2. Publish directory: `./`
3. Deploy from GitHub

## Environment Variables Needed for Production:
- `PORT` (automatically set by most platforms)
- `NODE_ENV=production`
- `MONGODB_URI` (your MongoDB connection string)
- `JWT_SECRET` (secure random string)
- `FRONTEND_URL` (your domain URL)

## Local Testing with Production Port:
```bash
# Test with port 80 (requires admin/sudo):
sudo PORT=80 npm start

# Test with port 8080:
PORT=8080 npm start

# Test with port 3000 (default):
npm start
```

## Custom Domain Setup:
1. Deploy to your chosen platform
2. Get the deployment URL
3. Configure DNS A records or CNAME
4. Add custom domain in platform settings
5. Enable SSL/HTTPS

## Database Setup for Production:
- MongoDB Atlas (recommended)
- MongoDB Cloud
- Self-hosted MongoDB

Your website is now ready for deployment with flexible port configuration!
