const mongoose = require('mongoose');

const CafeSettingsSchema = new mongoose.Schema({
  cafeName: {
    type: String,
    default: 'CoffeeBlend Mumbai'
  },
  tagline: {
    type: String,
    default: 'Artisanal Single-Origin Coffee & Gourmet Café'
  },
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '23:00' },
    days: { type: String, default: 'Monday - Sunday (7 Days)' }
  },
  delivery: {
    maxRadiusKm: { type: Number, default: 10 },
    baseDeliveryFee: { type: Number, default: 40 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    estimatedSpeedKmPerHour: { type: Number, default: 20 },
    basePrepMinutes: { type: Number, default: 15 }
  },
  loyalty: {
    pointsPerRupeeSpent: { type: Number, default: 0.1 }, // 1 pt per ₹10
    rupeeValuePerPoint: { type: Number, default: 1.0 },   // 1 pt = ₹1
    maxRedemptionPercent: { type: Number, default: 50 }   // up to 50% of subtotal
  },
  contact: {
    email: { type: String, default: 'contact@coffeeblend.in' },
    phone: { type: String, default: '+91 98200 12345' },
    address: { type: String, default: 'Shop 4, Ground Floor, Silver Pearl, Waterfield Road, Bandra West, Mumbai 400050' },
    supportHours: { type: String, default: '8:00 AM – 11:00 PM IST' }
  },
  notifications: {
    orderAlertsEmail: { type: Boolean, default: true },
    lowStockAlertsEmail: { type: Boolean, default: true },
    dailyDigestEmail: { type: Boolean, default: false }
  },
  updatedBy: {
    type: String,
    default: 'admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CafeSettings', CafeSettingsSchema);
