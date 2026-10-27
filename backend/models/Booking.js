const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  firstName: { type: String, required: [true, 'First name is required'], trim: true },
  lastName:  { type: String, required: [true, 'Last name is required'], trim: true },
  email:     { type: String, trim: true },
  date:      { type: String, required: [true, 'Date is required'] },
  time:      { type: String, required: [true, 'Time is required'] },
  phone:     { type: String, required: [true, 'Phone is required'], trim: true },
  guests:    { type: Number, default: 2, min: 1, max: 20 },
  message:   { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  preOrderItems: [{
    productId: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    size: String,
    milk: String,
    sugar: String
  }],
  cancelReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
