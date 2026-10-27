const mongoose = require('mongoose');

const ProductGoalSchema = new mongoose.Schema({
  metricName: {
    type: String,
    required: [true, 'Metric name is required'],
    trim: true
  },
  baselineValue: {
    type: String,
    required: true,
    trim: true
  },
  targetValue: {
    type: String,
    required: true,
    trim: true
  },
  currentValue: {
    type: String,
    required: true,
    trim: true
  },
  timeframe: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: String,
    required: true,
    trim: true,
    default: 'Founder / PM'
  },
  status: {
    type: String,
    enum: ['On Track', 'At Risk', 'Behind', 'Achieved'],
    default: 'On Track'
  },
  linkedMetricKey: {
    type: String,
    enum: ['eligible_revenue', 'total_orders', 'average_order_value', 'repeat_rate', 'loyalty_engagement', 'custom'],
    default: 'custom'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ProductGoalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ProductGoal', ProductGoalSchema);
