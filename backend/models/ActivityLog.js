const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  adminUser: {
    type: String,
    required: true,
    default: 'admin'
  },
  adminEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    enum: [
      'PRODUCT_CREATE',
      'PRODUCT_UPDATE',
      'PRODUCT_DELETE',
      'PRODUCT_AVAILABILITY',
      'ORDER_STATUS_UPDATE',
      'ORDER_CANCELLED',
      'INVENTORY_ADJUST',
      'COUPON_CREATE',
      'COUPON_DEACTIVATE',
      'BOOKING_STATUS_UPDATE',
      'REVIEW_MODERATION',
      'ROADMAP_CREATE',
      'ROADMAP_UPDATE',
      'PROBLEM_CREATE',
      'PROBLEM_UPDATE',
      'FEATURE_RICE_UPDATE',
      'EXPERIMENT_CREATE',
      'EXPERIMENT_STATUS',
      'GOAL_UPDATE',
      'DECISION_LOG',
      'CAMPAIGN_CREATE',
      'CAMPAIGN_SENT',
      'SETTINGS_UPDATE',
      'CSV_EXPORT'
    ]
  },
  section: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
