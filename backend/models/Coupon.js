const mongoose = require('mongoose');

const CouponUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  usedAt: { type: Date, default: Date.now },
  discountApplied: { type: Number, default: 0 }
}, { _id: true });

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 1
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number, // Applicable for percentage discount
    default: 1000
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 100 // Total max uses across all customers
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  fulfilmentRestriction: {
    type: String,
    enum: ['all', 'delivery', 'pickup', 'dine_in'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedBy: [CouponUsageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CouponSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);
