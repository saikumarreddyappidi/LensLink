// LensLink Backend - MongoDB Powered API
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const photographerRoutes = require('./routes/photographers');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');

const User = require('./models/User');
const Photographer = require('./models/Photographer');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI environment variable');
    process.exit(1);
}

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

if (NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

app.get('/api/health', async (req, res) => {
    try {
        const connectionState = mongoose.connection.readyState;
        const isConnected = connectionState === 1;

        let userCount = 0;
        let photographerCount = 0;
        let bookingCount = 0;

        if (isConnected) {
            [userCount, photographerCount, bookingCount] = await Promise.all([
                User.estimatedDocumentCount(),
                Photographer.estimatedDocumentCount(),
                Booking.estimatedDocumentCount()
            ]);
        }

        res.json({
            status: isConnected ? 'OK' : 'ERROR',
            message: 'LensLink Backend API is running',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            database: isConnected ? 'MongoDB Atlas - Connected' : 'MongoDB - Disconnected',
            mongoState: connectionState,
            version: '3.0.0',
            dataStats: {
                users: userCount,
                photographers: photographerCount,
                bookings: bookingCount
            }
        });
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch health metrics',
            error: NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/photographers', photographerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'LensLink Backend is running',
        docs: 'https://github.com/saikumarreddyappidi/LensLink'
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL || '10', 10)
        });

        console.log('✅ Connected to MongoDB');
        console.log('📦 Database:', mongoose.connection.db.databaseName);

        app.listen(PORT, () => {
            console.log(`🚀 LensLink Backend Server running on port ${PORT}`);
            console.log(`📍 Environment: ${NODE_ENV}`);
            console.log('🌐 CORS enabled for: https://lenslink.live');
            console.log('💾 Using MongoDB for persistence');
            console.log('🔍 Health check: /api/health');
        });
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

startServer();

const gracefulShutdown = () => {
    console.log('🛑 Shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('� MongoDB connection closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
