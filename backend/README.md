# LensLink Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (version 18 or higher)
- MongoDB database (local or cloud)
- Git

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your settings
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## 🌐 Database Setup

### Option 1: MongoDB Atlas (Recommended for Production)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `.env`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Use connection string: `mongodb://localhost:27017/lenslink`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

### Photographers
- `GET /api/photographers` - Get all photographers
- `GET /api/photographers/:id` - Get photographer by ID
- `PUT /api/photographers/profile` - Update photographer profile
- `POST /api/photographers/portfolio` - Add portfolio image
- `DELETE /api/photographers/portfolio/:imageId` - Remove portfolio image

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/messages` - Add message to booking

## 🔐 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- Helmet security headers

## 🚀 Deployment Options

### Option 1: Heroku
1. Create Heroku app
2. Add MongoDB Atlas add-on
3. Set environment variables
4. Deploy from Git

### Option 2: Railway
1. Connect GitHub repository
2. Set environment variables
3. Auto-deploy on push

### Option 3: DigitalOcean App Platform
1. Create new app from GitHub
2. Configure environment variables
3. Deploy

## 📱 Frontend Integration

Update your frontend code to use the backend API:

```javascript
// Example API configuration
const API_BASE_URL = 'https://your-backend-url.com/api';

// Login function
async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
}

// Register function
async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  return await response.json();
}
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json     # Dependencies
```

## 📞 Support

For issues or questions:
- Check the logs: `npm run logs`
- Verify environment variables
- Ensure MongoDB connection
- Check CORS settings

## 🔄 Migration from localStorage

Your existing localStorage data can be migrated using the API:

1. Export localStorage data from frontend
2. Create user accounts via API
3. Import user data to database
4. Update frontend to use API instead of localStorage
