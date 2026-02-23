const mongoose = require('mongoose');

const photographerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  specialties: [{
    type: String,
    enum: [
      'wedding',
      'portrait',
      'event',
      'commercial',
      'fashion',
      'landscape',
      'wildlife',
      'sports',
      'food',
      'architecture',
      'newborn',
      'family',
      'corporate',
      'product',
      'real-estate',
      'other'
    ]
  }],
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative'],
    max: [10000, 'Hourly rate seems too high']
  },
  packageDeals: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Package name cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Package description cannot exceed 500 characters']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Package price cannot be negative']
    },
    duration: {
      type: String,
      required: true
    },
    includes: [String]
  }],
  portfolio: [{
    title: {
      type: String,
      maxlength: [100, 'Portfolio title cannot exceed 100 characters']
    },
    imageUrl: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: [200, 'Portfolio description cannot exceed 200 characters']
    },
    category: {
      type: String,
      enum: [
        'wedding',
        'portrait',
        'event',
        'commercial',
        'fashion',
        'landscape',
        'wildlife',
        'sports',
        'food',
        'architecture',
        'newborn',
        'family',
        'corporate',
        'product',
        'real-estate',
        'other'
      ]
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  equipment: [{
    type: String,
    maxlength: [100, 'Equipment description cannot exceed 100 characters']
  }],
  serviceAreas: [{
    city: {
      type: String,
      required: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    radius: {
      type: Number,
      min: [0, 'Service radius cannot be negative'],
      max: [500, 'Service radius cannot exceed 500 km']
    }
  }],
  availability: {
    monday: { available: Boolean, timeSlots: [String] },
    tuesday: { available: Boolean, timeSlots: [String] },
    wednesday: { available: Boolean, timeSlots: [String] },
    thursday: { available: Boolean, timeSlots: [String] },
    friday: { available: Boolean, timeSlots: [String] },
    saturday: { available: Boolean, timeSlots: [String] },
    sunday: { available: Boolean, timeSlots: [String] }
  },
  rating: {
    average: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  reviews: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['license', 'insurance', 'portfolio', 'certification']
    },
    url: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
photographerSchema.index({ user: 1 });
photographerSchema.index({ specialties: 1 });
photographerSchema.index({ 'serviceAreas.city': 1 });
photographerSchema.index({ hourlyRate: 1 });
photographerSchema.index({ 'rating.average': -1 });
photographerSchema.index({ createdAt: -1 });

// Virtual for full user data
photographerSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Calculate average rating
photographerSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
  this.rating.count = this.reviews.length;
};

// Add review
photographerSchema.methods.addReview = function(clientId, bookingId, rating, comment) {
  this.reviews.push({
    client: clientId,
    booking: bookingId,
    rating,
    comment
  });
  this.calculateAverageRating();
  return this.save();
};

// Get available time slots for a specific date
photographerSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const dayAvailability = this.availability[dayOfWeek];
  
  if (!dayAvailability || !dayAvailability.available) {
    return [];
  }
  
  return dayAvailability.timeSlots || [];
};

// Pre-save middleware to calculate rating
photographerSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    this.calculateAverageRating();
  }
  next();
});

module.exports = mongoose.model('Photographer', photographerSchema);
