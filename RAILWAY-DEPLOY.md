# Railway Deployment Configuration for LensLink Backend

## Environment Variables to Set in Railway Dashboard:

NODE_ENV=production
PORT=$PORT
MONGODB_URI=mongodb+srv://lenslink:CHANGE_THIS_PASSWORD@cluster0.mongodb.net/lenslink?retryWrites=true&w=majority
JWT_SECRET=lenslink-super-secure-jwt-secret-key-2025-railway-deployment-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

## Railway Deployment Steps:

### 1. Database Setup (MongoDB Atlas - Free)
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create cluster (choose AWS, Free tier)
4. Create database user:
   - Username: lenslink
   - Password: (generate secure password)
5. Add IP address: 0.0.0.0/0 (allow all - for Railway)
6. Get connection string and update MONGODB_URI above

### 2. Railway Deployment
1. Go to railway.app
2. Sign in with GitHub
3. Click "Deploy from GitHub repo"
4. Select your LensLink repository
5. Railway auto-detects backend folder
6. In Variables tab, add environment variables above
7. Update MONGODB_URI with your actual MongoDB Atlas connection string
8. Deploy!

### 3. Domain Configuration
Railway provides:
- Free subdomain: https://your-app-name.up.railway.app
- Custom domain support (optional)

### 4. Auto-Deploy Setup
- Railway automatically redeploys when you push to GitHub
- No manual deployment needed
- Continuous deployment from main branch

## Post-Deployment:

### Your Backend URLs:
- API Base: https://your-app-name.up.railway.app/api
- Health Check: https://your-app-name.up.railway.app/api/health
- Authentication: https://your-app-name.up.railway.app/api/auth

### Update Frontend:
Replace the API_CONFIG.baseUrl in your frontend files:
```javascript
const API_CONFIG = {
    baseUrl: 'https://your-app-name.up.railway.app/api',
    timeout: 10000
};
```

## Cost: 100% FREE
- Railway free tier: $5/month credits (enough for small apps)
- MongoDB Atlas: Free tier (512MB storage)
- Total cost: $0 for development and small production use

## Benefits of Railway:
✅ Automatic deployment from GitHub
✅ Free SSL certificates
✅ Environment variable management
✅ Real-time logs and monitoring
✅ Zero-downtime deployments
✅ Automatic scaling
