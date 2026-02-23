# LensLink Registration Troubleshooting Guide

## Problem: Cannot create account during registration

### Possible Causes & Solutions:

## 1. **Backend Server Not Running**
**Symptoms:** 
- Registration form shows "Cannot connect to server" error
- Console shows fetch/network errors

**Solution:**
1. **Option A: Use the batch file (Recommended)**
   - Double-click `start-server.bat` to automatically start the server
   - This bypasses PowerShell execution policy issues

2. **Option B: Fix PowerShell execution policy**
   ```powershell
   # Run PowerShell as Administrator and execute:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Then try: npm install
   ```

3. **Option C: Use Command Prompt instead of PowerShell**
   ```cmd
   # Open Command Prompt (cmd) and run:
   npm install
   node server.js
   ```

## 2. **Dependencies Not Installed**
**Solution:**
- Run `npm install` to install required packages
- If that fails, delete `node_modules` folder and `package-lock.json`, then run `npm install` again

## 3. **MongoDB Not Running**
**Symptoms:** 
- Server starts but shows MongoDB connection errors

**Solution:**
- Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
- Make sure MongoDB service is running
- Alternative: Update `.env` file to use MongoDB Atlas (cloud database)

## 4. **Port Already in Use**
**Symptoms:** 
- Server shows "EADDRINUSE" error

**Solution:**
- Change port in `.env` file from 5000 to another port (e.g., 5001)
- Or kill the process using port 5000

## 5. **CORS Issues**
**Symptoms:** 
- Browser console shows CORS errors

**Solution:**
- Make sure server is running on port 5000
- Check that FRONTEND_URL in `.env` matches your frontend URL

## Testing Steps:

### Step 1: Test Frontend Form
1. Open `test-registration.html` in your browser
2. Fill out the form and submit
3. Check if validation works and data is formatted correctly

### Step 2: Start Backend Server
1. Double-click `start-server.bat`
2. Wait for "Server running on port 5000" message
3. Check for any error messages

### Step 3: Test Full Registration
1. Open `index.html` in your browser
2. Try registering with the form
3. Check browser console (F12) for any errors

## Quick Start Commands:

```bash
# Install dependencies
npm install

# Create .env file (if it doesn't exist)
echo NODE_ENV=development > .env
echo PORT=5000 >> .env
echo MONGODB_URI=mongodb://localhost:27017/lenslink >> .env
echo JWT_SECRET=your-secret-key >> .env

# Start server
node server.js
```

## Environment Variables Required:

Create a `.env` file with:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lenslink
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

## Debugging Tips:

1. **Check Browser Console**: Press F12 and look for JavaScript errors
2. **Check Server Logs**: Look at the terminal where server is running
3. **Network Tab**: In browser dev tools, check if API calls are being made
4. **Test Registration Form**: Use the standalone test form first

## Still Having Issues?

1. Make sure you have Node.js 14+ installed
2. Try using a different browser
3. Temporarily disable antivirus/firewall
4. Check if Windows Defender is blocking the server
