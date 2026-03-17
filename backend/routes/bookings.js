const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Photographer = require('../models/Photographer');
const Booking = require('../models/Booking');

const router = express.Router();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Create new booking (client only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      photographerId,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      packageDetails,
      specialRequests,
      guestCount
    } = req.body;

    // Validate required fields
    if (!photographerId || !eventType || !eventDate || !startTime || !endTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if photographer exists
    const photographer = await Photographer.findById(photographerId);
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    // Check if event date is in the future
    const eventDateTime = new Date(eventDate);
    if (eventDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future'
      });
    }

    // Check photographer availability for the date
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][eventDateTime.getDay()];
    const availability = photographer.availability[dayOfWeek];
    
    if (!availability || !availability.available) {
      return res.status(400).json({
        success: false,
        message: 'Photographer is not available on this day'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      photographer: photographerId,
      eventDate: {
        $gte: new Date(eventDate + 'T00:00:00.000Z'),
        $lt: new Date(eventDate + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Photographer is already booked for this date'
      });
    }

    // Calculate duration and total amount
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = (endMinutes - startMinutes) / 60;

    let totalAmount = 0;
    let packageInfo = {};

    if (packageDetails && packageDetails.packageId) {
      // Using a package deal
      const packageDeal = photographer.packageDeals.id(packageDetails.packageId);
      if (packageDeal) {
        totalAmount = packageDeal.price;
        packageInfo = {
          name: packageDeal.name,
          price: packageDeal.price,
          includes: packageDeal.includes
        };
      }
    } else {
      // Using hourly rate
      totalAmount = photographer.hourlyRate * duration;
    }

    // Create booking
    const booking = new Booking({
      client: req.user._id,
      photographer: photographerId,
      eventType,
      eventDate: eventDateTime,
      startTime,
      endTime,
      duration,
      location,
      package: packageInfo,
      totalAmount,
      specialRequests,
      guestCount
    });

    await booking.save();

    // Populate related data
    await booking.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'photographer', populate: { path: 'user', select: 'name email phone' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (req.user.role === 'photographer') {
      // Find photographer profile
      const photographer = await Photographer.findOne({ user: req.user._id });
      if (photographer) {
        query.photographer = photographer._id;
      }
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const bookings = await Booking.find(query)
      .populate('client', 'name email phone avatar')
      .populate({
        path: 'photographer',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

// Get booking by ID
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('client', 'name email phone avatar')
      .populate({
        path: 'photographer',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('communication.sender', 'name avatar');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.client._id.toString() === req.user._id.toString() ||
                     booking.photographer.user._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        booking
      }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking'
    });
  }
});

// Update booking status (photographer only)
router.put('/:bookingId/status', authenticateToken, async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const booking = await Booking.findById(req.params.bookingId)
      .populate('photographer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the photographer for this booking
    if (booking.photographer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the assigned photographer can update status.'
      });
    }

    await booking.updateStatus(status, reason);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking
      }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// Add message to booking
router.post('/:bookingId/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const booking = await Booking.findById(req.params.bookingId)
      .populate('photographer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.client.toString() === req.user._id.toString() ||
                     booking.photographer.user.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await booking.addMessage(req.user._id, message.trim());

    res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        communication: booking.communication
      }
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

// Cancel booking
router.put('/:bookingId/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.bookingId)
      .populate('photographer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to cancel this booking
    const hasAccess = booking.client.toString() === req.user._id.toString() ||
                     booking.photographer.user.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled', 'refunded'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    // Calculate cancellation fee
    const cancellationFee = booking.calculateCancellationFee();
    booking.cancellationFee = cancellationFee;
    booking.refundAmount = booking.totalAmount - cancellationFee;

    await booking.updateStatus('cancelled', reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        cancellationFee,
        refundAmount: booking.refundAmount
      }
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// Add review (client only, after booking completion)
router.post('/:bookingId/review', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findById(req.params.bookingId)
      .populate('photographer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the client for this booking
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients can add reviews.'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    if (booking.review && booking.review.rating) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Add review to booking
    booking.review = {
      rating,
      comment,
      reviewDate: new Date()
    };

    await booking.save();

    // Add review to photographer
    const photographer = await Photographer.findById(booking.photographer._id);
    await photographer.addReview(req.user._id, booking._id, rating, comment);

    res.json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: booking.review
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review'
    });
  }
});

module.exports = router;
