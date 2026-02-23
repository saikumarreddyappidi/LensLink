// Admin Routes for LensLink
const express = require('express');
const User = require('../models/User');
const Photographer = require('../models/Photographer');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Admin middleware - check if user is admin
const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

// Admin login (special endpoint)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find admin user
        const user = await User.findOne({ email, role: 'admin' }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-fallback-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get dashboard stats
router.get('/stats', protect, adminMiddleware, async (req, res) => {
    try {
        const [userCount, photographerCount, bookingCount, clientCount] = await Promise.all([
            User.countDocuments(),
            Photographer.countDocuments(),
            Booking.countDocuments(),
            User.countDocuments({ role: 'client' })
        ]);
        
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name email role createdAt');
            
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('client', 'name email')
            .populate('photographer', 'businessName');
        
        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers: userCount,
                    totalPhotographers: photographerCount,
                    totalBookings: bookingCount,
                    totalClients: clientCount
                },
                recentUsers,
                recentBookings
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
});

// Get all users
router.get('/users', protect, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .sort({ createdAt: -1 })
            .select('name email role phone isActive createdAt lastLogin');
            
        res.json({
            success: true,
            data: { users }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get all photographers
router.get('/photographers', protect, adminMiddleware, async (req, res) => {
    try {
        const photographers = await Photographer.find()
            .populate('user', 'name email phone isActive')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            data: { photographers }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch photographers'
        });
    }
});

// Update photographer status (e.g., mark as available/unavailable)
router.patch('/photographers/:id/status', protect, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable, note } = req.body;
        
        const photographer = await Photographer.findByIdAndUpdate(
            id,
            { 
                isAvailable,
                adminNote: note,
                lastUpdatedByAdmin: new Date()
            },
            { new: true }
        ).populate('user', 'name email');
        
        if (!photographer) {
            return res.status(404).json({
                success: false,
                message: 'Photographer not found'
            });
        }
        
        res.json({
            success: true,
            message: `Photographer marked as ${isAvailable ? 'available' : 'unavailable'}`,
            data: { photographer }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update photographer status'
        });
    }
});

// Assign photographer to a booking (when original is absent)
router.patch('/bookings/:id/assign', protect, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { photographerId, reason } = req.body;
        
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const newPhotographer = await Photographer.findById(photographerId);
        if (!newPhotographer) {
            return res.status(404).json({
                success: false,
                message: 'Photographer not found'
            });
        }
        
        // Save reassignment history
        booking.reassignmentHistory = booking.reassignmentHistory || [];
        booking.reassignmentHistory.push({
            previousPhotographer: booking.photographer,
            newPhotographer: photographerId,
            reason: reason || 'Photographer unavailable',
            reassignedAt: new Date(),
            reassignedBy: req.user._id
        });
        
        booking.photographer = photographerId;
        await booking.save();
        
        await booking.populate('photographer', 'businessName');
        await booking.populate('client', 'name email');
        
        res.json({
            success: true,
            message: 'Photographer reassigned successfully',
            data: { booking }
        });
    } catch (error) {
        console.error('Reassignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reassign photographer'
        });
    }
});

// Get all bookings
router.get('/bookings', protect, adminMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('client', 'name email phone')
            .populate('photographer', 'businessName')
            .sort({ eventDate: -1 });
            
        res.json({
            success: true,
            data: { bookings }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
});

// Deactivate/activate user
router.patch('/users/:id/status', protect, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('name email role isActive');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

module.exports = router;
