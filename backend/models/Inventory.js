const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  change: { type: Number, required: true }, // positive for restock, negative for deduction
  reason: { type: String, default: 'order_deduction' }, // 'order_deduction', 'manual_restock', 'spillage_waste', 'order_cancellation_restore'
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  updatedBy: { type: String, default: 'system' }
}, { _id: true });

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['beans', 'dairy', 'syrups', 'packaging', 'bakery', 'snacks', 'other'],
    default: 'other'
  },
  unit: {
    type: String,
    enum: ['kg', 'litres', 'ml', 'units', 'pieces', 'packets'],
    required: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  minThreshold: {
    type: Number,
    required: true,
    default: 5
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  movementHistory: [StockMovementSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

InventorySchema.index({ category: 1 });
InventorySchema.index({ stockQuantity: 1, minThreshold: 1 });

module.exports = mongoose.model('Inventory', InventorySchema);
