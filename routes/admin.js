/**
 * routes/admin.js  –  Admin-only API routes
 * Covers: login, stats, users, photographers, bookings, messages (feedback)
 */

const express  = require('express');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Photographer = require('../models/Photographer');
const Booking  = require('../models/Booking');
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Admin guard middleware ────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required.' });
  }
  next();
};

// ─────────────────────────────────────────────────────────
// POST /api/admin/login
// ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalPhotographers, totalBookings, totalClients, totalMessages, unreadMessages] =
      await Promise.all([
        User.countDocuments(),
        Photographer.countDocuments(),
        Booking.countDocuments(),
        User.countDocuments({ role: 'client' }),
        Feedback.countDocuments(),
        Feedback.countDocuments({ read: false }),
      ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalPhotographers, totalBookings, totalClients, totalMessages, unreadMessages }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
      .select('name email role isActive isVerified createdAt');
    res.json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: req.body.isActive }, { new: true }
    ).select('name email role isActive');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/photographers
// ─────────────────────────────────────────────────────────
router.get('/photographers', protect, adminOnly, async (req, res) => {
  try {
    const photographers = await Photographer.find()
      .populate('user', 'name email isActive')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { photographers } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch photographers.' });
  }
});

// PATCH /api/admin/photographers/:id/status
router.patch('/photographers/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { isAvailable, note } = req.body;
    const photographer = await Photographer.findByIdAndUpdate(
      req.params.id,
      { isAvailable, adminNote: note, lastUpdatedByAdmin: new Date() },
      { new: true }
    ).populate('user', 'name email');
    if (!photographer) return res.status(404).json({ success: false, message: 'Photographer not found.' });
    res.json({ success: true, data: { photographer } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update photographer.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/bookings
// ─────────────────────────────────────────────────────────
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('client', 'name email')
      .populate({ path: 'photographer', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { bookings } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
});

// PATCH /api/admin/bookings/:id/assign
router.patch('/bookings/:id/assign', protect, adminOnly, async (req, res) => {
  try {
    const { photographerId, reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const newPh = await Photographer.findById(photographerId);
    if (!newPh) return res.status(404).json({ success: false, message: 'Photographer not found.' });

    booking.reassignmentHistory = booking.reassignmentHistory || [];
    booking.reassignmentHistory.push({
      previousPhotographer: booking.photographer,
      newPhotographer: photographerId,
      reason: reason || 'Admin reassignment',
      reassignedAt: new Date(),
      reassignedBy: req.user._id,
    });
    booking.photographer = photographerId;
    await booking.save();

    await booking.populate('client', 'name email');
    await booking.populate({ path: 'photographer', populate: { path: 'user', select: 'name' } });

    res.json({ success: true, message: 'Photographer reassigned.', data: { booking } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reassign.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/messages   – all contact form submissions
// ─────────────────────────────────────────────────────────
router.get('/messages', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// PATCH /api/admin/messages/:id/read  – mark as read
router.patch('/messages/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const msg = await Feedback.findByIdAndUpdate(
      req.params.id, { read: true }, { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, data: { message: msg } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark message as read.' });
  }
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', protect, adminOnly, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

module.exports = router;
