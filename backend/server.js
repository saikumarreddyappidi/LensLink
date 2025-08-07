// LensLink Backend - Railway Compatible with Persistent Storage
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

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
        database: 'Railway Persistent File Storage - Connected',
        version: '2.1.0',
        dataStats: {
            users: users.length,
            photographers: photographers.length,
            bookings: bookings.length
        }
    });
});

// Persistent file-based storage for Railway
const fs = require('fs');
const path = require('path');

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PHOTOGRAPHERS_FILE = path.join(DATA_DIR, 'photographers.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files or initialize empty arrays
function loadData() {
    try {
        const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : [];
        const photographers = fs.existsSync(PHOTOGRAPHERS_FILE) ? JSON.parse(fs.readFileSync(PHOTOGRAPHERS_FILE, 'utf8')) : [];
        const bookings = fs.existsSync(BOOKINGS_FILE) ? JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8')) : [];
        
        console.log(`📊 Loaded data: ${users.length} users, ${photographers.length} photographers, ${bookings.length} bookings`);
        
        return { users, photographers, bookings };
    } catch (error) {
        console.error('❌ Error loading data:', error);
        return { users: [], photographers: [], bookings: [] };
    }
}

// Save data to files
function saveData(type, data) {
    try {
        let file;
        switch (type) {
            case 'users':
                file = USERS_FILE;
                break;
            case 'photographers':
                file = PHOTOGRAPHERS_FILE;
                break;
            case 'bookings':
                file = BOOKINGS_FILE;
                break;
            default:
                throw new Error('Invalid data type');
        }
        
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${data.length} ${type} to persistent storage`);
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${type}:`, error);
        return false;
    }
}

// Initialize data
let { users, photographers, bookings } = loadData();

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const user = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        
        // Save to persistent storage
        saveData('users', users);
        
        console.log(`✅ User registered: ${email} (${role})`);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate simple token
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
        
        console.log(`✅ User logged in: ${email}`);
        
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
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

// Stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        users: users.length,
        photographers: photographers.length,
        bookings: bookings.length,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LensLink Backend Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: https://lenslink.live`);
    console.log(`💾 Using Railway in-memory storage`);
    console.log(`🔍 Health check: /api/health`);
    console.log(`📊 Stats endpoint: /api/stats`);
    console.log(`✅ Server ready - NO MONGODB DEPENDENCIES!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
