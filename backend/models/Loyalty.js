const mongoose = require('mongoose');

const LoyaltyTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  points: {
    type: Number,
    required: true // Positive for earned, negative for redeemed
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'refunded', 'bonus'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

LoyaltyTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
