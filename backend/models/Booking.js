const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photographer',
    required: [true, 'Photographer is required']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
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
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Please provide a valid time in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Please provide a valid time in HH:MM format'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0.5, 'Duration must be at least 30 minutes'],
    max: [24, 'Duration cannot exceed 24 hours']
  },
  location: {
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  package: {
    name: {
      type: String,
      maxlength: [100, 'Package name cannot exceed 100 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    includes: [String]
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'online', 'other']
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Advance amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters']
  },
  guestCount: {
    type: Number,
    min: [1, 'Guest count must be at least 1'],
    max: [10000, 'Guest count seems too high']
  },
  deliverables: {
    editedPhotos: {
      type: Number,
      default: 0,
      min: [0, 'Edited photos count cannot be negative']
    },
    rawPhotos: {
      type: Number,
      default: 0,
      min: [0, 'Raw photos count cannot be negative']
    },
    album: {
      type: Boolean,
      default: false
    },
    digitalDelivery: {
      type: Boolean,
      default: true
    },
    printRights: {
      type: Boolean,
      default: false
    },
    deliveryTimeline: {
      type: String,
      maxlength: [100, 'Delivery timeline cannot exceed 100 characters']
    }
  },
  communication: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancellationDate: {
    type: Date
  },
  cancellationFee: {
    type: Number,
    default: 0,
    min: [0, 'Cancellation fee cannot be negative']
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  },
  completedAt: {
    type: Date
  },
  review: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    reviewDate: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
bookingSchema.index({ client: 1 });
bookingSchema.index({ photographer: 1 });
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

// Compound indexes
bookingSchema.index({ photographer: 1, eventDate: 1 });
bookingSchema.index({ client: 1, status: 1 });

// Virtual for photographer data
bookingSchema.virtual('photographerData', {
  ref: 'Photographer',
  localField: 'photographer',
  foreignField: '_id',
  justOne: true
});

// Virtual for client data
bookingSchema.virtual('clientData', {
  ref: 'User',
  localField: 'client',
  foreignField: '_id',
  justOne: true
});

// Calculate remaining balance
bookingSchema.virtual('remainingBalance').get(function() {
  return Math.max(0, this.totalAmount - this.advanceAmount);
});

// Check if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.eventDate;
});

// Check if booking is today
bookingSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.eventDate);
  return today.toDateString() === eventDate.toDateString();
});

// Add communication message
bookingSchema.methods.addMessage = function(senderId, message) {
  this.communication.push({
    sender: senderId,
    message: message
  });
  return this.save();
};

// Mark messages as read
bookingSchema.methods.markMessagesAsRead = function(userId) {
  this.communication.forEach(msg => {
    if (msg.sender.toString() !== userId.toString()) {
      msg.isRead = true;
    }
  });
  return this.save();
};

// Update booking status with timestamp
bookingSchema.methods.updateStatus = function(newStatus, reason = null) {
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancellationDate = new Date();
    if (reason) {
      this.cancellationReason = reason;
    }
  }
  
  return this.save();
};

// Calculate cancellation fee based on time until event
bookingSchema.methods.calculateCancellationFee = function() {
  const now = new Date();
  const eventDate = new Date(this.eventDate);
  const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  
  let feePercentage = 0;
  
  if (daysUntilEvent < 7) {
    feePercentage = 0.5; // 50% fee if cancelled within 7 days
  } else if (daysUntilEvent < 30) {
    feePercentage = 0.25; // 25% fee if cancelled within 30 days
  } else {
    feePercentage = 0.1; // 10% fee if cancelled more than 30 days in advance
  }
  
  return Math.round(this.totalAmount * feePercentage);
};

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Calculate duration if start and end times are provided
  if (this.startTime && this.endTime && !this.duration) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    this.duration = (endMinutes - startMinutes) / 60;
  }
  
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
