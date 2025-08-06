const express = require('express');
const { body, validationResult } = require('express-validator');
const Photographer = require('../models/Photographer');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all photographers
// @route   GET /api/photographers
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    
    // Search by name
    if (req.query.search) {
      const users = await User.find({
        name: { $regex: req.query.search, $options: 'i' },
        role: 'photographer'
      }).select('_id');
      const userIds = users.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Filter by specialty
    if (req.query.specialty) {
      query.specialties = { $in: [req.query.specialty] };
    }

    // Filter by location
    if (req.query.city) {
      query['location.city'] = { $regex: req.query.city, $options: 'i' };
    }

    // Sort options
    let sortOptions = {};
    switch (req.query.sort) {
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'price_low':
        sortOptions = { 'pricing.hourlyRate': 1 };
        break;
      case 'price_high':
        sortOptions = { 'pricing.hourlyRate': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { averageRating: -1, totalReviews: -1 };
    }

    const photographers = await Photographer.find(query)
      .populate('user', 'name email profileImage createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-reviews'); // Exclude reviews for list view

    const total = await Photographer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: photographers.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      photographers
    });

  } catch (error) {
    console.error('Get photographers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting photographers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get single photographer
// @route   GET /api/photographers/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const photographer = await Photographer.findById(req.params.id)
      .populate('user', 'name email profileImage createdAt')
      .populate('reviews.user', 'name profileImage');

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    if (!photographer.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile is not active'
      });
    }

    res.status(200).json({
      success: true,
      photographer
    });

  } catch (error) {
    console.error('Get photographer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting photographer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update photographer profile
// @route   PUT /api/photographers/profile
// @access  Private/Photographer
router.put('/profile', protect, authorize('photographer'), [
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('specialties')
    .optional()
    .isArray()
    .withMessage('Specialties must be an array'),
  body('pricing.hourlyRate')
    .optional()
    .isNumeric()
    .withMessage('Hourly rate must be a number')
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

    let photographer = await Photographer.findOne({ user: req.user.id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    const updateFields = {};
    const allowedFields = ['bio', 'specialties', 'location', 'pricing', 'experience', 'socialMedia'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    photographer = await Photographer.findByIdAndUpdate(
      photographer._id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('user', 'name email profileImage');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      photographer
    });

  } catch (error) {
    console.error('Update photographer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add portfolio item
// @route   POST /api/photographers/portfolio
// @access  Private/Photographer
router.post('/portfolio', protect, authorize('photographer'), [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('imageUrl')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Please provide a valid image URL'),
  body('category')
    .optional()
    .isIn(['weddings', 'portraits', 'events', 'commercial', 'fashion', 'nature', 'street', 'sports', 'other'])
    .withMessage('Invalid category')
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

    const photographer = await Photographer.findOne({ user: req.user.id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    const portfolioItem = {
      title: req.body.title,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl,
      category: req.body.category || 'other'
    };

    photographer.portfolio.push(portfolioItem);
    await photographer.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      portfolioItem: photographer.portfolio[photographer.portfolio.length - 1]
    });

  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding portfolio item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete portfolio item
// @route   DELETE /api/photographers/portfolio/:portfolioId
// @access  Private/Photographer
router.delete('/portfolio/:portfolioId', protect, authorize('photographer'), async (req, res) => {
  try {
    const photographer = await Photographer.findOne({ user: req.user.id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    const portfolioItem = photographer.portfolio.id(req.params.portfolioId);
    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }

    photographer.portfolio.pull(req.params.portfolioId);
    await photographer.save();

    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });

  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add review to photographer
// @route   POST /api/photographers/:id/reviews
// @access  Private/Client
router.post('/:id/reviews', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
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

    const photographer = await Photographer.findById(req.params.id);
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    // Check if user already reviewed this photographer
    const existingReview = photographer.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this photographer'
      });
    }

    const review = {
      user: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment || ''
    };

    photographer.reviews.push(review);
    await photographer.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get photographer availability
// @route   GET /api/photographers/:id/availability
// @access  Public
router.get('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const photographer = await Photographer.findById(req.params.id)
      .select('availability')
      .populate('availability.timeSlots.booking', 'bookingDate startTime endTime bookingStatus');

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    let availability = photographer.availability;

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      availability.timeSlots = availability.timeSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate >= start && slotDate <= end;
      });
    }

    res.status(200).json({
      success: true,
      availability
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
