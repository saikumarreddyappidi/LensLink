# 🗄️ MongoDB Atlas Setup for LensLink Backend

## 🚀 Step-by-Step MongoDB Atlas Configuration

### **Step 1: Create MongoDB Atlas Account**
1. On the MongoDB Atlas page that just opened, click **"Try Free"**
2. Sign up with one of these options:
   - **Google Account** (fastest)
   - **GitHub Account** (recommended since you're already using GitHub)
   - **Email and Password**
3. Verify your email if prompted

### **Step 2: Create Your First Cluster**
1. After logging in, you'll see "Deploy a database"
2. Choose **"M0 Sandbox"** (FREE forever - 512MB storage)
3. **Cloud Provider**: Select **AWS** (recommended)
4. **Region**: Choose closest to your location:
   - US: `us-east-1 (N. Virginia)` or `us-west-2 (Oregon)`
   - Europe: `eu-west-1 (Ireland)` or `eu-central-1 (Frankfurt)`
   - Asia: `ap-southeast-1 (Singapore)` or `ap-south-1 (Mumbai)`
5. **Cluster Name**: Change to `lenslink-cluster`
6. Click **"Create"** (takes 1-3 minutes)

### **Step 3: Create Database User**
1. While cluster is creating, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `lenslink-user`
5. **Password**: Click **"Autogenerate Secure Password"** 
   - **🔥 IMPORTANT**: Copy and save this password!
6. **Database User Privileges**: **"Read and write to any database"**
7. Click **"Add User"**

### **Step 4: Configure Network Access**
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow access from anywhere"** (0.0.0.0/0)
4. **Comment**: `Render.com deployment`
5. Click **"Confirm"**

### **Step 5: Get Connection String**
1. Go back to **"Database"** (left sidebar)
2. Wait for cluster status to show **"Available"** (green)
3. Click **"Connect"** button on your cluster
4. Choose **"Connect your application"**
5. **Driver**: Node.js
6. **Version**: 4.1 or later
7. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://lenslink-user:<password>@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. **Replace `<password>`** with the actual password you copied in Step 3

---

## 📝 **Save Your MongoDB Configuration**

**Your Cluster Details:**
- **Cluster Name**: lenslink-cluster
- **Username**: lenslink-user
- **Password**: [PASTE YOUR GENERATED PASSWORD HERE]
- **Connection String**: mongodb+srv://lenslink-user:[YOUR-PASSWORD]@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

---

## 🧪 **Test Your MongoDB Connection**

### **Step 6: Test Connection Locally**
1. Create a `.env` file in your backend folder
2. Add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://lenslink-user:[YOUR-PASSWORD]@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=lenslink-super-secret-jwt-key-2024-secure
   NODE_ENV=development
   PORT=3000
   ```
3. Test the connection by starting your server locally

---

## 🔧 **Environment Variables for Render.com**

Once you have your connection string, you'll need these environment variables for Render deployment:

```
MONGODB_URI=mongodb+srv://lenslink-user:[YOUR-PASSWORD]@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=lenslink-super-secret-jwt-key-2024-secure
NODE_ENV=production
PORT=10000
```

---

## ✅ **Verification Checklist**

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster deployed
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied and password replaced
- [ ] Local .env file created (optional)

---

## 🚀 **Next Steps**

After completing MongoDB setup:
1. ✅ **MongoDB Atlas**: Done!
2. 🔄 **Deploy to Render.com**: Use your connection string
3. 🧪 **Test API**: Verify all endpoints work

---

## 🛠️ **Troubleshooting**

**If connection fails:**
- Double-check password in connection string
- Ensure IP whitelist includes 0.0.0.0/0
- Verify cluster is "Available" status
- Check username is `lenslink-user`

**Common mistakes:**
- Forgetting to replace `<password>` in connection string
- Using wrong database user credentials
- Cluster not fully deployed yet
