# 🔐 LensLink Backend Deployment Credentials

## MongoDB Atlas Configuration
- **Cluster Name**: lenslink-cluster
- **Username**: lenslink-user
- **Password**: [SAVE YOUR GENERATED PASSWORD HERE]
- **Connection String**: mongodb+srv://lenslink-user:[YOUR-PASSWORD]@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

## Environment Variables for Render.com
```
MONGODB_URI=mongodb+srv://lenslink-user:[YOUR-PASSWORD]@lenslink-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=lenslink-super-secret-jwt-key-2024-secure
NODE_ENV=production
PORT=10000
```

## Render.com Deployment Settings
- **Service Name**: lenslink-backend
- **Repository**: LensLink
- **Branch**: main
- **Root Directory**: backend
- **Build Command**: npm install
- **Start Command**: npm start
- **Plan**: Free

## Next Steps Checklist
- [ ] Complete MongoDB Atlas setup
- [ ] Save connection string with real password
- [ ] Create Render.com account
- [ ] Deploy backend service
- [ ] Test API endpoints
- [ ] Update frontend API URL

---
**IMPORTANT**: Replace [YOUR-PASSWORD] with the actual password from MongoDB Atlas!
