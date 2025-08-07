const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Photographer = require('../models/Photographer');

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

// Get all photographers (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const filters = { isActive: true };
    
    if (req.query.specialty) {
      filters.specialties = { $in: [req.query.specialty] };
    }
    
    if (req.query.city) {
      filters['serviceAreas.city'] = new RegExp(req.query.city, 'i');
    }
    
    if (req.query.minRating) {
      filters['rating.average'] = { $gte: parseFloat(req.query.minRating) };
    }
    
    if (req.query.maxRate) {
      filters.hourlyRate = { $lte: parseFloat(req.query.maxRate) };
    }

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (req.query.sortBy === 'rating') {
      sortOptions = { 'rating.average': -1 };
    } else if (req.query.sortBy === 'price') {
      sortOptions = { hourlyRate: 1 };
    }

    const photographers = await Photographer.find(filters)
      .populate('user', 'name email phone avatar profile')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Photographer.countDocuments(filters);

    res.json({
      success: true,
      data: {
        photographers,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get photographers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get photographers'
    });
  }
});

// Get photographer by ID (public)
router.get('/:photographerId', async (req, res) => {
  try {
    const photographer = await Photographer.findById(req.params.photographerId)
      .populate('user', 'name email phone avatar profile')
      .populate('reviews.client', 'name avatar');

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    res.json({
      success: true,
      data: {
        photographer
      }
    });

  } catch (error) {
    console.error('Get photographer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get photographer'
    });
  }
});

// Update photographer profile (photographer only)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is a photographer
    if (req.user.role !== 'photographer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only photographers can update photographer profiles.'
      });
    }

    const photographer = await Photographer.findOne({ user: req.user._id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    // Allowed updates
    const allowedUpdates = [
      'businessName', 'specialties', 'experience', 'hourlyRate', 
      'packageDeals', 'equipment', 'serviceAreas', 'availability'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update photographer
    const updatedPhotographer = await Photographer.findByIdAndUpdate(
      photographer._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone avatar profile');

    res.json({
      success: true,
      message: 'Photographer profile updated successfully',
      data: {
        photographer: updatedPhotographer
      }
    });

  } catch (error) {
    console.error('Update photographer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update photographer profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add portfolio image (photographer only)
router.post('/portfolio', authenticateToken, async (req, res) => {
  try {
    // Check if user is a photographer
    if (req.user.role !== 'photographer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only photographers can add portfolio images.'
      });
    }

    const photographer = await Photographer.findOne({ user: req.user._id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    const { title, imageUrl, description, category } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Add to portfolio
    photographer.portfolio.push({
      title,
      imageUrl,
      description,
      category
    });

    await photographer.save();

    res.json({
      success: true,
      message: 'Portfolio image added successfully',
      data: {
        portfolio: photographer.portfolio
      }
    });

  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add portfolio image'
    });
  }
});

// Remove portfolio image (photographer only)
router.delete('/portfolio/:imageId', authenticateToken, async (req, res) => {
  try {
    // Check if user is a photographer
    if (req.user.role !== 'photographer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only photographers can remove portfolio images.'
      });
    }

    const photographer = await Photographer.findOne({ user: req.user._id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    // Remove from portfolio
    photographer.portfolio = photographer.portfolio.filter(
      item => item._id.toString() !== req.params.imageId
    );

    await photographer.save();

    res.json({
      success: true,
      message: 'Portfolio image removed successfully',
      data: {
        portfolio: photographer.portfolio
      }
    });

  } catch (error) {
    console.error('Remove portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove portfolio image'
    });
  }
});

// Get photographer availability (public)
router.get('/:photographerId/availability', async (req, res) => {
  try {
    const photographer = await Photographer.findById(req.params.photographerId)
      .select('availability');

    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer not found'
      });
    }

    res.json({
      success: true,
      data: {
        availability: photographer.availability
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability'
    });
  }
});

// Update availability (photographer only)
router.put('/availability', authenticateToken, async (req, res) => {
  try {
    // Check if user is a photographer
    if (req.user.role !== 'photographer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only photographers can update availability.'
      });
    }

    const photographer = await Photographer.findOne({ user: req.user._id });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        message: 'Photographer profile not found'
      });
    }

    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: 'Availability data is required'
      });
    }

    photographer.availability = availability;
    await photographer.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: photographer.availability
      }
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

module.exports = router;
