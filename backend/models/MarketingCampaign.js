const mongoose = require('mongoose');

const MarketingCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  channel: {
    type: String,
    enum: ['Email', 'In-App Banner', 'SMS Notification'],
    default: 'Email'
  },
  targetAudience: {
    type: String,
    enum: ['All Registered Customers', 'High Spenders (Spent > ₹500)', 'Inactive Customers (> 30 days)', 'Loyalty Point Holders (> 20 pts)'],
    default: 'All Registered Customers'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  discountCoupon: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sent'],
    default: 'Draft',
    index: true
  },
  scheduledDate: {
    type: String,
    default: ''
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MarketingCampaign', MarketingCampaignSchema);
