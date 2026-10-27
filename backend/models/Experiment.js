const mongoose = require('mongoose');

const ExperimentSchema = new mongoose.Schema({
  experimentKey: {
    type: String,
    required: true,
    index: true // e.g. 'home_cta_v1'
  },
  variant: {
    type: String,
    required: true, // e.g. 'A' (Order Now) or 'B' (Schedule My Coffee)
    enum: ['A', 'B', 'control', 'test']
  },
  userId: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true,
    enum: ['exposure', 'cta_click', 'checkout_start', 'order_completed']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

ExperimentSchema.index({ experimentKey: 1, variant: 1, event: 1 });

module.exports = mongoose.model('Experiment', ExperimentSchema);
