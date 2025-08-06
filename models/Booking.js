const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  photographer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Photographer',
    required: true
  },
  bookingDate: {
    type: Date,
    required: [true, 'Please provide a booking date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide shoot location']
    },
    city: String,
    state: String,
    zipcode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  eventType: {
    type: String,
    enum: ['wedding', 'portrait', 'event', 'commercial', 'fashion', 'family', 'graduation', 'birthday', 'other'],
    required: true
  },
  packageSelected: {
    name: String,
    description: String,
    price: Number
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  numberOfGuests: {
    type: Number,
    min: 1
  },
  deliveryDetails: {
    expectedDeliveryDate: Date,
    deliveryMethod: {
      type: String,
      enum: ['digital', 'physical', 'both'],
      default: 'digital'
    },
    deliveryAddress: String
  },
  communication: [{
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
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
  paymentDetails: {
    stripePaymentIntentId: String,
    transactionId: String,
    paymentMethod: String,
    paidAt: Date
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  refundAmount: Number,
  refundedAt: Date
}, {
  timestamps: true
});

// Index for efficient querying
bookingSchema.index({ client: 1, bookingDate: 1 });
bookingSchema.index({ photographer: 1, bookingDate: 1 });
bookingSchema.index({ bookingStatus: 1 });

// Pre-save middleware to calculate total amount if not provided
bookingSchema.pre('save', function(next) {
  if (!this.totalAmount && this.packageSelected && this.packageSelected.price) {
    this.totalAmount = this.packageSelected.price;
  }
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
  
  // Can cancel if booking is more than 24 hours away and status is pending or confirmed
  return hoursDiff > 24 && ['pending', 'confirmed'].includes(this.bookingStatus);
};

// Method to check if booking can be modified
bookingSchema.methods.canBeModified = function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
  
  // Can modify if booking is more than 48 hours away and status is pending or confirmed
  return hoursDiff > 48 && ['pending', 'confirmed'].includes(this.bookingStatus);
};

module.exports = mongoose.model('Booking', bookingSchema);
