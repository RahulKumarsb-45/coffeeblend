const mongoose = require('mongoose');

const RoadmapItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Roadmap feature title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['Ordering & Menu', 'Delivery & Mumbai Logistics', 'Loyalty & Rewards', 'In-Store Experience', 'Operations & Kitchen', 'Mobile & Web Experience'],
    default: 'Ordering & Menu'
  },
  status: {
    type: String,
    enum: ['Backlog', 'Planned', 'In Progress', 'Testing', 'Released'],
    default: 'Backlog',
    index: true
  },
  owner: {
    type: String,
    trim: true,
    default: 'Product Team'
  },
  milestone: {
    type: String,
    trim: true,
    default: 'Q1 2025'
  },
  targetDate: {
    type: String,
    default: ''
  },
  dependencies: {
    type: String,
    default: ''
  },
  releaseNotes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
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

RoadmapItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RoadmapItem', RoadmapItemSchema);
