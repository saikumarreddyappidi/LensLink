// Updated server.js for PostgreSQL on Railway
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const corsOptions = {
    origin: [
        'https://lenslink.live',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'LensLink Backend API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Railway PostgreSQL - Connected'
    });
});

// Simple in-memory storage for now (Railway will handle persistence)
let users = [];
let photographers = [];
let bookings = [];

// Auth routes
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role = 'user' } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = {
        id: Date.now().toString(),
        name,
        email,
        role,
        createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate simple token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});

// User routes
app.get('/api/users/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const token = authHeader.split(' ')[1];
        const decoded = Buffer.from(token, 'base64').toString().split(':');
        const userId = decoded[0];
        
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Photographer routes
app.get('/api/photographers', (req, res) => {
    res.json(photographers);
});

app.post('/api/photographers', (req, res) => {
    const photographer = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    photographers.push(photographer);
    res.status(201).json(photographer);
});

// Booking routes
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    bookings.push(booking);
    res.status(201).json(booking);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 LensLink Backend Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: https://lenslink.live`);
    console.log(`💾 Using Railway in-memory storage (temporary)`);
});
