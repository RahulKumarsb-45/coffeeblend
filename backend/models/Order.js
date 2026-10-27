const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  size: { type: String, default: 'Regular' },
  milk: { type: String, default: 'Standard' },
  sugar: { type: String, default: 'Normal' }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  fulfilmentType: {
    type: String,
    enum: ['pickup', 'dine_in', 'delivery'],
    default: 'pickup'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    pincode: String,
    phone: String
  },
  deliveryDetails: {
    distanceKm: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    estimatedMinutes: { type: Number, default: 30 },
    targetDeliveryTime: { type: Date }
  },
  advanceOrder: {
    isAdvance: { type: Boolean, default: false },
    arrivalTime: { type: Date },
    notes: { type: String }
  },
  tableDetails: {
    guests: { type: Number },
    reservationTime: { type: String },
    tableNumber: { type: String },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  estimatedReadyTime: {
    type: Date
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  inventoryDeducted: {
    type: Boolean,
    default: false
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    changedBy: { type: String, default: 'system' }
  }],
  cancelReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);
