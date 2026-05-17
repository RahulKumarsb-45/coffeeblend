const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  paypalOrderId: {
    type: String,
    required: true,
    unique: true
  },
  paypalPayerId: {
    type: String
  },
  paypalTransactionId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['created', 'approved', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  payerEmail: {
    type: String
  },
  payerName: {
    type: String
  },
  rawResponse: {
    type: Object  // full PayPal response stored for records
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
