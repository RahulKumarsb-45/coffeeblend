const mongoose = require('mongoose');

const FeaturePrioritizationSchema = new mongoose.Schema({
  featureName: {
    type: String,
    required: [true, 'Feature name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  reach: {
    type: Number,
    required: true,
    min: 1,
    default: 500,
    comment: 'Number of customers or orders affected per quarter (estimate)'
  },
  impact: {
    type: Number,
    required: true,
    enum: [0.25, 0.5, 1, 2, 3],
    default: 1,
    comment: '0.25 minimal, 0.5 low, 1 medium, 2 high, 3 massive'
  },
  confidence: {
    type: Number,
    required: true,
    enum: [0.5, 0.8, 1.0],
    default: 0.8,
    comment: '0.5 = 50% Low, 0.8 = 80% Medium, 1.0 = 100% High'
  },
  effort: {
    type: Number,
    required: true,
    min: 0.5,
    max: 20,
    default: 2,
    comment: 'Person-weeks or sprint iterations (estimate)'
  },
  riceScore: {
    type: Number,
    default: 0,
    index: true
  },
  status: {
    type: String,
    enum: ['Proposed', 'Evaluating', 'Approved for Roadmap', 'Postponed', 'Rejected'],
    default: 'Proposed'
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

// Auto-calculate RICE score before saving
FeaturePrioritizationSchema.pre('save', function(next) {
  const r = this.reach || 1;
  const i = this.impact || 1;
  const c = this.confidence || 0.8;
  const e = Math.max(0.5, this.effort || 1);
  this.riceScore = Math.round(((r * i * c) / e) * 10) / 10;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeaturePrioritization', FeaturePrioritizationSchema);
