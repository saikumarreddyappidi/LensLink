// LensLink Backend - Railway Compatible with PostgreSQL Database
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Global variables for database status
let isDatabaseConnected = false;
let databaseType = 'File Storage';

// Database initialization
async function initializeDatabase() {
    try {
        // Test connection
        await pool.query('SELECT NOW()');
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                phone VARCHAR(20),
                profile_image TEXT,
                bio TEXT,
                location VARCHAR(255),
                hourly_rate INTEGER,
                experience INTEGER,
                specialties TEXT[],
                portfolio JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                photographer_id INTEGER REFERENCES users(id),
                client_id INTEGER REFERENCES users(id),
                date DATE NOT NULL,
                time TIME NOT NULL,
                session_type VARCHAR(255),
                duration INTEGER,
                requirements TEXT,
                total_cost DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ PostgreSQL Database connected and tables initialized');
        isDatabaseConnected = true;
        databaseType = 'PostgreSQL Database';
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        console.log('🔄 Falling back to file-based storage...');
        isDatabaseConnected = false;
        databaseType = 'File Storage Fallback';
        loadFallbackStorage();
        return false;
    }
}

// Fallback to file-based storage if PostgreSQL fails
const STORAGE_FILE = './storage.json';
let fallbackStorage = {
    users: [],
    bookings: []
};

function loadFallbackStorage() {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            const data = fs.readFileSync(STORAGE_FILE, 'utf8');
            fallbackStorage = JSON.parse(data);
            console.log(`📁 Loaded ${fallbackStorage.users.length} users from file storage`);
        }
    } catch (error) {
        console.error('Error loading fallback storage:', error);
    }
}

function saveFallbackStorage() {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(fallbackStorage, null, 2));
    } catch (error) {
        console.error('Error saving fallback storage:', error);
    }
}

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
        database: `${databaseType} - Connected`,
        version: '3.0.0'
    });
});

// User registration - with persistent storage
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role = 'user', phone, bio, location, hourlyRate, experience, specialties } = req.body;
    
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        if (isDatabaseConnected) {
            // PostgreSQL storage
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'User already exists' });
            }
            
            const result = await pool.query(`
                INSERT INTO users (name, email, password, role, phone, bio, location, hourly_rate, experience, specialties)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, name, email, role, created_at
            `, [name, email, hashedPassword, role, phone, bio, location, hourlyRate, experience, specialties]);
            
            const user = result.rows[0];
            console.log(`✅ User registered in PostgreSQL: ${email} (${role})`);
            
            res.status(201).json({
                message: 'User registered successfully',
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        } else {
            // File storage fallback
            const existingUser = fallbackStorage.users.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            
            const user = {
                id: Date.now().toString(),
                name,
                email,
                password: hashedPassword,
                role,
                phone,
                bio,
                location,
                hourlyRate,
                experience,
                specialties,
                createdAt: new Date().toISOString()
            };
            
            fallbackStorage.users.push(user);
            saveFallbackStorage();
            
            console.log(`✅ User registered in file storage: ${email} (${role})`);
            
            res.status(201).json({
                message: 'User registered successfully',
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// User login - with persistent storage
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (isDatabaseConnected) {
            // PostgreSQL storage
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            const user = result.rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'lenslink-secret-key',
                { expiresIn: '24h' }
            );
            
            console.log(`✅ User logged in from PostgreSQL: ${email}`);
            
            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        } else {
            // File storage fallback
            const user = fallbackStorage.users.find(u => u.email === email);
            
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'lenslink-secret-key',
                { expiresIn: '24h' }
            );
            
            console.log(`✅ User logged in from file storage: ${email}`);
            
            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Get all users (for debugging)
app.get('/api/users', async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
            res.json({ users: result.rows, source: 'PostgreSQL' });
        } else {
            const users = fallbackStorage.users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt
            }));
            res.json({ users, source: 'File Storage' });
        }
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Clear all data (for testing)
app.delete('/api/clear-data', async (req, res) => {
    try {
        if (isDatabaseConnected) {
            await pool.query('TRUNCATE TABLE bookings, users RESTART IDENTITY CASCADE');
            res.json({ message: 'PostgreSQL data cleared' });
        } else {
            fallbackStorage = { users: [], bookings: [] };
            saveFallbackStorage();
            res.json({ message: 'File storage data cleared' });
        }
    } catch (error) {
        console.error('Clear data error:', error);
        res.status(500).json({ message: 'Failed to clear data', error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server and initialize database
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 LensLink Backend Server running on port ${PORT}`);
        console.log(`📊 Database: ${databaseType}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⚡ Railway Deployment Ready!`);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
