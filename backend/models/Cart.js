const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  image:     { type: String, default: 'images/menu-1.jpg' },
  quantity:  { type: Number, required: true, min: 1, default: 1 },
  size:      { type: String, default: 'Regular' },
  milk:      { type: String, default: 'Standard' },
  sugar:     { type: String, default: 'Normal' }
}, { _id: true });

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items:       { type: [CartItemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  updatedAt:   { type: Date, default: Date.now }
});

CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', CartSchema);
