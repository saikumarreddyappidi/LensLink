const mongoose = require('mongoose');

const photographerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  profilePhoto: {
    type: String, // Base64 encoded image data or URL
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  specialties: [{
    type: String,
    enum: ['weddings', 'portraits', 'events', 'commercial', 'fashion', 'nature', 'street', 'sports', 'other']
  }],
  location: {
    address: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  portfolio: [{
    title: String,
    description: String,
    imageUrl: String,
    category: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  pricing: {
    hourlyRate: {
      type: Number,
      min: 0
    },
    packageDeals: [{
      name: String,
      description: String,
      price: Number,
      duration: Number, // in hours
      includes: [String]
    }]
  },
  availability: {
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    workingHours: {
      start: String, // "09:00"
      end: String    // "18:00"
    },
    timeSlots: [{
      date: Date,
      startTime: String,
      endTime: String,
      isBooked: {
        type: Boolean,
        default: false
      },
      booking: {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking'
      }
    }]
  },
  experience: {
    yearsOfExperience: Number,
    equipment: [String],
    certifications: [String]
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  backupCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 20
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    website: String,
    linkedin: String
  }
}, {
  timestamps: true
});

// Calculate average rating
photographerSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 5;
    this.totalReviews = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = (sum / this.reviews.length).toFixed(1);
    this.totalReviews = this.reviews.length;
  }
};

// Pre-save middleware to calculate average rating
photographerSchema.pre('save', function(next) {
  this.calculateAverageRating();
  next();
});

module.exports = mongoose.model('Photographer', photographerSchema);
