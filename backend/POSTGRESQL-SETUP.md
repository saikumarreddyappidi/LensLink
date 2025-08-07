# LensLink Railway PostgreSQL Setup Guide

## 🎯 CRITICAL: Cross-Device Login Fix

Your backend currently uses **in-memory storage** which loses data when the server restarts. This is why you can't login from laptop with credentials created on phone.

## ✅ Solution: PostgreSQL Database

I've updated your backend to use **persistent PostgreSQL storage** that will work across all devices.

## 🚀 Railway Deployment Steps

### 1. Add PostgreSQL to Railway Project

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Open your LensLink project
3. Click **"+ New Service"**
4. Select **"Add Database"** → **"PostgreSQL"**
5. Wait for PostgreSQL to deploy (takes 1-2 minutes)

### 2. Environment Variables

Railway will automatically create these environment variables for your backend:
- `DATABASE_URL` - Public connection string
- `DATABASE_PRIVATE_URL` - Private connection string (recommended)

### 3. Deploy Updated Backend

Your new backend code will automatically:
- ✅ Try to connect to PostgreSQL first
- ✅ Fall back to file storage if PostgreSQL fails
- ✅ Store user accounts persistently
- ✅ Enable cross-device login

## 📊 What Changes:

### Before (Current):
- ❌ **In-memory storage** - data lost on restart
- ❌ **No cross-device login** - accounts don't persist
- ❌ **Users disappear** when server restarts

### After (Fixed):
- ✅ **PostgreSQL database** - data persists forever
- ✅ **Cross-device login** - works on phone, laptop, any device
- ✅ **Account persistence** - users never disappear
- ✅ **Proper password hashing** with bcrypt
- ✅ **JWT authentication** tokens

## 🔧 Technical Improvements:

1. **Database Tables Created:**
   - `users` table with proper schema
   - `bookings` table for photographer bookings
   - Automatic table creation on first run

2. **Security Enhancements:**
   - Passwords hashed with bcrypt
   - JWT tokens for authentication
   - Proper SQL injection protection

3. **Reliability:**
   - Connection pooling
   - Error handling
   - Graceful fallback to file storage

## 🧪 Testing:

After deployment, test the cross-device functionality:

1. **Phone**: Create account at https://lenslink.live
2. **Laptop**: Login with same credentials
3. **Should work perfectly!** ✅

## 📱 Immediate Action Required:

1. **Add PostgreSQL** to your Railway project
2. **Redeploy** your backend service
3. **Test** cross-device login

The backend code is ready - just need to add the PostgreSQL database to Railway!

## 🆘 Fallback Mode:

If PostgreSQL setup fails, the backend will automatically use **file-based storage** which still persists data better than the current in-memory approach.

---

**Status**: Ready to deploy with persistent database! 🚀
