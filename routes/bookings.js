const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Photographer = require('../models/Photographer');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/Client
router.post('/', protect, [
  body('photographer')
    .notEmpty()
    .withMessage('Photographer ID is required'),
  body('bookingDate')
    .isISO8601()
    .withMessage('Please provide a valid booking date'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid start time (HH:MM format)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid end time (HH:MM format)'),
  body('location.address')
    .notEmpty()
    .withMessage('Shoot location is required'),
  body('eventType')
    .isIn(['wedding', 'portrait', 'event', 'commercial', 'fashion', 'family', 'graduation', 'birthday', 'other'])
    .withMessage('Please provide a valid event type'),
  body('totalAmount')
    .isNumeric()
    .withMessage('Total amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      photographer,
      bookingDate,
      startTime,
      endTime,
      location,
      eventType,
      packageSelected,
      totalAmount,
      specialRequests,
      numberOfGuests
    } = req.body;

    // Check if photographer exists
    const photographerProfile = await Photographer.findById(photographer);
    if (!photographerProfile || !photographerProfile.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found or inactive'
      });
    }

    // Calculate duration
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const duration = (end - start) / (1000 * 60 * 60); // hours

    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if the date is in the future
    const bookingDateTime = new Date(bookingDate);
    if (bookingDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be in the future'
      });
    }

    // Check for conflicts
    const conflictingBooking = await Booking.findOne({
      photographer,
      bookingDate: {
        $gte: new Date(bookingDate).setHours(0, 0, 0, 0),
        $lt: new Date(bookingDate).setHours(23, 59, 59, 999)
      },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ],
      bookingStatus: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Photographer is not available at this time'
      });
    }

    // Create booking
    const booking = await Booking.create({
      client: req.user.id,
      photographer,
      bookingDate,
      startTime,
      endTime,
      duration,
      location,
      eventType,
      packageSelected,
      totalAmount,
      specialRequests,
      numberOfGuests
    });

    // Populate the booking with user and photographer details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate({
        path: 'photographer',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all bookings for current user
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Build query based on user role
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'photographer') {
      const photographerProfile = await Photographer.findOne({ user: req.user.id });
      if (photographerProfile) {
        query.photographer = photographerProfile._id;
      }
    }

    // Filter by status
    if (req.query.status) {
      query.bookingStatus = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.bookingDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('client', 'name email phone profileImage')
      .populate({
        path: 'photographer',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name email phone profileImage')
      .populate({
        path: 'photographer',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .populate('communication.sender', 'name profileImage');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    const photographerProfile = await Photographer.findOne({ user: req.user.id });
    const isAuthorized = 
      booking.client._id.toString() === req.user.id ||
      (photographerProfile && booking.photographer._id.toString() === photographerProfile._id.toString()) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
router.put('/:id/status', protect, [
  body('status')
    .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid booking status'),
  body('cancellationReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, cancellationReason } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name email')
      .populate({
        path: 'photographer',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const photographerProfile = await Photographer.findOne({ user: req.user.id });
    const isClient = booking.client._id.toString() === req.user.id;
    const isPhotographer = photographerProfile && booking.photographer._id.toString() === photographerProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isPhotographer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Status change authorization rules
    if (status === 'confirmed' || status === 'rejected') {
      if (!isPhotographer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only photographer can confirm or reject bookings'
        });
      }
    }

    if (status === 'cancelled') {
      if (!booking.canBeCancelled()) {
        return res.status(400).json({
          success: false,
          message: 'Booking cannot be cancelled (less than 24 hours before event or already started)'
        });
      }
    }

    // Update booking
    booking.bookingStatus = status;
    
    if (status === 'cancelled') {
      booking.cancellationReason = cancellationReason;
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user.id;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add communication to booking
// @route   POST /api/bookings/:id/communication
// @access  Private
router.post('/:id/communication', protect, [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const photographerProfile = await Photographer.findOne({ user: req.user.id });
    const isClient = booking.client.toString() === req.user.id;
    const isPhotographer = photographerProfile && booking.photographer.toString() === photographerProfile._id.toString();

    if (!isClient && !isPhotographer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add communication to this booking'
      });
    }

    const communication = {
      sender: req.user.id,
      message: req.body.message
    };

    booking.communication.push(communication);
    await booking.save();

    // Populate the new communication
    const updatedBooking = await Booking.findById(booking._id)
      .populate('communication.sender', 'name profileImage');

    const newCommunication = updatedBooking.communication[updatedBooking.communication.length - 1];

    res.status(201).json({
      success: true,
      message: 'Communication added successfully',
      communication: newCommunication
    });

  } catch (error) {
    console.error('Add communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding communication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update booking details (before confirmation)
// @route   PUT /api/bookings/:id
// @access  Private/Client
router.put('/:id', protect, [
  body('bookingDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid booking date'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid start time (HH:MM format)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid end time (HH:MM format)'),
  body('location.address')
    .optional()
    .notEmpty()
    .withMessage('Shoot location cannot be empty'),
  body('totalAmount')
    .optional()
    .isNumeric()
    .withMessage('Total amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only client can update booking details
    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Check if booking can be modified
    if (!booking.canBeModified()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be modified (less than 48 hours before event or not in pending/confirmed status)'
      });
    }

    const updateFields = {};
    const allowedFields = ['bookingDate', 'startTime', 'endTime', 'location', 'eventType', 'specialRequests', 'numberOfGuests', 'totalAmount'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Recalculate duration if time is updated
    if (updateFields.startTime || updateFields.endTime) {
      const startTime = updateFields.startTime || booking.startTime;
      const endTime = updateFields.endTime || booking.endTime;
      
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const duration = (end - start) / (1000 * 60 * 60);

      if (duration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      updateFields.duration = duration;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
    .populate('client', 'name email phone')
    .populate({
      path: 'photographer',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
