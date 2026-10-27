const mongoose = require('mongoose');

const ProductDecisionSchema = new mongoose.Schema({
  decisionTitle: {
    type: String,
    required: [true, 'Decision title is required'],
    trim: true
  },
  context: {
    type: String,
    required: true,
    trim: true
  },
  supportingEvidence: {
    type: String,
    required: true,
    trim: true
  },
  alternativesConsidered: {
    type: String,
    required: true,
    trim: true
  },
  chosenDecision: {
    type: String,
    required: true,
    trim: true
  },
  expectedOutcome: {
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
  date: {
    type: Date,
    default: Date.now
  },
  relatedFeatureOrExperiment: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProductDecision', ProductDecisionSchema);
