# 🚀 Full Stack Deployment Guide - LensLink

## Current Status: ✅ READY TO DEPLOY

### 📋 **What's Configured:**
- ✅ Frontend: Netlify with proxy configuration
- ✅ Backend: Railway with MongoDB Atlas
- ✅ Domain: lenslink.live
- ✅ HTTPS: Force SSL enabled
- ✅ Proxy: API calls routed from Netlify to Railway

---

## 🎯 **Step 1: Railway Backend Deployment**

### Railway URL: https://railway.app
1. **Connect GitHub**: Link your repository
2. **Deploy from**: `/backend` folder
3. **Environment Variables Required**:
   ```
   MONGODB_URI=mongodb+srv://saikumarreddyappidi274_db_user:dOj2ZEPewWGA7gW4@cluster0.qbmu8a8.mongodb.net/lenslink?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=3000
   ```

4. **Custom Domain**: `lenslink-production.up.railway.app`
5. **Health Check**: `/api/health`

---

## 🌐 **Step 2: Netlify Frontend Deployment**

### Netlify URL: https://netlify.com
1. **Connect GitHub**: Link your repository
2. **Deploy from**: Root folder (`/`)
3. **Build Settings**:
   - Build command: *(leave empty)*
   - Publish directory: `.` (root)
4. **Custom Domain**: `lenslink.live`

---

## 🔄 **Step 3: Deploy Process**

### A. Push to GitHub (✅ DONE)
```bash
git add .
git commit -m "feat: Production deployment configuration"
git push origin main
```

### B. Railway Auto-Deploy
- Railway will automatically detect changes
- Backend will redeploy from `/backend` folder
- Health check: https://lenslink-production.up.railway.app/api/health

### C. Netlify Auto-Deploy
- Netlify will automatically detect changes
- Frontend will redeploy with proxy configuration
- Live site: https://lenslink.live

---

## 🧪 **Step 4: Test Full Stack**

### Test Backend API:
```
https://lenslink-production.up.railway.app/api/health
```
**Expected Response:**
```json
{
  "status": "OK",
  "message": "LensLink Backend API is running",
  "database": "MongoDB Atlas - Connected"
}
```

### Test Frontend with Proxy:
```
https://lenslink.live/api/health
```
**Expected Response:** Same as above (proxied)

### Test Website Features:
1. 🌐 Visit: https://lenslink.live
2. 📝 Register new account
3. 🔐 Login
4. 👨‍💼 Browse photographers
5. 📅 Make a booking

---

## 🚨 **Troubleshooting**

### If API calls fail:
1. Check Railway backend: https://lenslink-production.up.railway.app/api/health
2. Check Netlify proxy: https://lenslink.live/api/health
3. Verify MongoDB connection in Railway logs

### If deployment fails:
1. **Railway**: Check environment variables
2. **Netlify**: Verify netlify.toml and _redirects files
3. **Domain**: Ensure DNS points to Netlify

---

## 📊 **Current Configuration Status**

| Component | Status | URL |
|-----------|--------|-----|
| 🔧 **Backend** | ✅ Ready | https://lenslink-production.up.railway.app |
| 🌐 **Frontend** | ✅ Ready | https://lenslink.live |
| 🗄️ **Database** | ✅ MongoDB Atlas | Cloud hosted |
| 🔒 **Security** | ✅ HTTPS + Headers | Force SSL |
| 🔄 **Proxy** | ✅ Configured | Netlify → Railway |

---

## 🎉 **Next Steps**

1. **Deploy**: Push changes trigger auto-deployment
2. **Test**: Verify full-stack functionality
3. **Monitor**: Check Railway and Netlify dashboards
4. **Scale**: Both platforms auto-scale as needed

**Your LensLink app is ready for production! 🚀**