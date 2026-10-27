const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

/* ── GET /api/reviews (Public) ── */
router.get('/', async (req, res) => {
  try {
    const { productId, limit = 20 } = req.query;
    const filter = { isApproved: true };
    if (productId && productId.match(/^[0-9a-fA-F]{24}$/)) {
      filter.product = productId;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 20)
      .populate('product', 'name image price category');

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

    res.json({
      success: true,
      count: reviews.length,
      averageRating: avgRating,
      reviews
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/reviews (Protected) ── */
router.post('/', protect, async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    const rateNum = parseInt(rating, 10);
    if (!rateNum || rateNum < 1 || rateNum > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a rating between 1 and 5 stars.' });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 5 characters.' });
    }

    const review = await Review.create({
      product: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null,
      order: orderId && orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null,
      user: req.user._id,
      userName: req.user.username,
      rating: rateNum,
      comment: comment.trim(),
      isApproved: true
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been published.',
      review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/reviews/:id (Protected: Owner or Admin) ── */
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    // Only review owner or admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
