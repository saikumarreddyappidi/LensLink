/**
 * Admin Setup Route - Initialize photographers with coordinates for map
 * POST /api/admin/setup-photographer-coords
 */

const express = require('express');
const router = express.Router();
const Photographer = require('../models/Photographer');

// Sample photographers with coordinates
const SAMPLE_COORDS = [
  { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
  { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
  { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
  { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
  { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  { lat: 26.9124, lng: 75.7873, city: 'Jaipur' }
];

// Add coordinates to existing photographers
router.post('/setup-photographer-coords', async (req, res) => {
  try {
    const photographers = await Photographer.find().limit(6);
    
    if (photographers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No photographers found. Please register photographers first.' 
      });
    }

    // Update photographers with coordinates
    const updates = photographers.map((photo, index) => {
      const coords = SAMPLE_COORDS[index % SAMPLE_COORDS.length];
      return Photographer.updateOne(
        { _id: photo._id },
        { 
          coordinates: { lat: coords.lat, lng: coords.lng },
          location: coords.city
        }
      );
    });

    await Promise.all(updates);

    const updated = await Photographer.find().select('name coordinates location');
    
    res.json({
      success: true,
      message: `✅ Updated ${photographers.length} photographers with coordinates!`,
      photographers: updated
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
