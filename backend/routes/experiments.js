const express = require('express');
const router = express.Router();
const Experiment = require('../models/Experiment');
const { protect, adminOnly } = require('../middleware/auth');

/* ── POST /api/experiments/log (Public) ── */
router.post('/log', async (req, res) => {
  try {
    const { experimentKey, variant, sessionId, event, metadata } = req.body;

    if (!experimentKey || !variant || !sessionId || !event) {
      return res.status(400).json({ success: false, message: 'Missing required experiment logging fields.' });
    }

    const logEntry = await Experiment.create({
      experimentKey,
      variant,
      sessionId,
      event,
      userId: req.user ? req.user._id : null,
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, logged: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/experiments/report (Admin only) ── */
router.get('/report', protect, adminOnly, async (req, res) => {
  try {
    const { experimentKey = 'home_cta_v1' } = req.query;

    const events = await Experiment.find({ experimentKey });

    const summary = {
      experimentKey,
      variants: {
        A: { name: 'Order Now (Standard CTA)', exposures: 0, clicks: 0, checkoutStarts: 0, conversions: 0 },
        B: { name: 'Schedule My Coffee (Advance CTA)', exposures: 0, clicks: 0, checkoutStarts: 0, conversions: 0 }
      }
    };

    events.forEach(e => {
      const v = e.variant === 'B' ? 'B' : 'A';
      if (e.event === 'exposure') summary.variants[v].exposures++;
      else if (e.event === 'cta_click') summary.variants[v].clicks++;
      else if (e.event === 'checkout_start') summary.variants[v].checkoutStarts++;
      else if (e.event === 'order_completed') summary.variants[v].conversions++;
    });

    // Compute conversion rates
    ['A', 'B'].forEach(v => {
      const exp = summary.variants[v].exposures;
      summary.variants[v].clickThroughRate = exp > 0 ? ((summary.variants[v].clicks / exp) * 100).toFixed(1) + '%' : '0.0%';
      summary.variants[v].conversionRate = exp > 0 ? ((summary.variants[v].conversions / exp) * 100).toFixed(1) + '%' : '0.0%';
    });

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
