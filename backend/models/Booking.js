const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  firstName: { type: String, required: [true, 'First name is required'] },
  lastName:  { type: String, required: [true, 'Last name is required'] },
  date:      { type: String, required: [true, 'Date is required'] },
  time:      { type: String, required: [true, 'Time is required'] },
  phone:     { type: String, required: [true, 'Phone is required'] },
  guests:    { type: Number, default: 2 },
  message:   { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
