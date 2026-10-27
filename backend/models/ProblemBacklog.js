const mongoose = require('mongoose');

const ProblemBacklogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem statement title is required'],
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  customerSegment: {
    type: String,
    enum: ['Daily Commuters', 'Remote Workers / Freelancers', 'Weekend Brunch Visitors', 'High-Spender VIPs', 'First-Time Web Visitors', 'All Customers'],
    default: 'All Customers'
  },
  evidence: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    enum: ['Customer Reviews', 'Support Feedback', 'Social Media / Google Maps', 'In-Store Barista Observations', 'Analytics Drop-Off', 'Customer Interviews'],
    default: 'Customer Reviews'
  },
  frequency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  severity: {
    type: String,
    enum: ['Minor', 'Major', 'Critical'],
    default: 'Major'
  },
  affectedJourney: {
    type: String,
    enum: ['Discovery & Menu', 'Cart & Customizations', 'Checkout & Mumbai Delivery', 'Payment (UPI / PayPal)', 'Advance Order Pickup', 'Loyalty Rewards'],
    default: 'Discovery & Menu'
  },
  status: {
    type: String,
    enum: ['Open', 'Under Investigation', 'Solution Designed', 'Resolved', 'Archived'],
    default: 'Open',
    index: true
  },
  linkedRoadmapItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoadmapItem',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ProblemBacklogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ProblemBacklog', ProblemBacklogSchema);
