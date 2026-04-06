/**
 * Script to add sample photographers with coordinates for map testing
 * Run: node add-photographer-coordinates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Photographer = require('./models/Photographer');

// Sample photographers with coordinates (major Indian cities)
const samplePhotographers = [
  {
    name: 'Rajesh Kumar',
    specialties: ['weddings', 'portraits'],
    location: 'Delhi',
    hourlyRate: 150,
    coordinates: { lat: 28.7041, lng: 77.1025 } // Delhi
  },
  {
    name: 'Priya Singh',
    specialties: ['fashion', 'commercial'],
    location: 'Mumbai',
    hourlyRate: 200,
    coordinates: { lat: 19.0760, lng: 72.8777 } // Mumbai
  },
  {
    name: 'Arun Patel',
    specialties: ['events', 'weddings'],
    location: 'Bangalore',
    hourlyRate: 175,
    coordinates: { lat: 12.9716, lng: 77.5946 } // Bangalore
  },
  {
    name: 'Neha Reddy',
    specialties: ['portraits', 'nature'],
    location: 'Hyderabad',
    hourlyRate: 120,
    coordinates: { lat: 17.3850, lng: 78.4867 } // Hyderabad
  },
  {
    name: 'Vikram Singh',
    specialties: ['commercial', 'corporate'],
    location: 'Pune',
    hourlyRate: 160,
    coordinates: { lat: 18.5204, lng: 73.8567 } // Pune
  },
  {
    name: 'Anjali Desai',
    specialties: ['weddings', 'events'],
    location: 'Jaipur',
    hourlyRate: 140,
    coordinates: { lat: 26.9124, lng: 75.7873 } // Jaipur
  }
];

async function addPhotographersWithCoordinates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lenslink', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing photographers (optional - comment out to keep existing)
    // await Photographer.deleteMany({});
    // console.log('🗑️  Cleared existing photographers');

    // Add sample photographers with coordinates
    const result = await Photographer.insertMany(samplePhotographers, { ordered: false });
    console.log(`✅ Added ${result.length} photographers with coordinates!`);

    // Display added photographers
    const photographers = await Photographer.find().select('name location coordinates');
    console.log('\n📍 Photographers with Coordinates:');
    photographers.forEach(p => {
      console.log(`  ${p.name} (${p.location}): ${p.coordinates?.lat}, ${p.coordinates?.lng}`);
    });

    console.log('\n🗺️  Map feature is now ready to test!');
    console.log('🎯 Visit: https://lenslink-app.onrender.com');
    console.log('📋 Go to: "Find Your Photographers" → Click "🗺️ Map View"\n');

  } catch (error) {
    console.error('❌ Error adding photographers:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

addPhotographersWithCoordinates();
