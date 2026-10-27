const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');

/* ── GET /api/recommendations (Public) ── */
router.get('/', async (req, res) => {
  try {
    const { category, productId } = req.query;

    let complementaryCategory = 'desserts';
    if (category === 'coffee' || category === 'hot_beverages') {
      complementaryCategory = 'desserts';
    } else if (category === 'desserts' || category === 'snacks' || category === 'burgers') {
      complementaryCategory = 'coffee';
    } else if (category === 'drinks' || category === 'cold_beverages') {
      complementaryCategory = 'burgers';
    }

    // 1. Fetch complementary products
    const complementary = await Product.find({
      category: complementaryCategory,
      isAvailable: true,
      _id: { $ne: productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }
    }).limit(4);

    // 2. Fetch popular items (based on orders or highest rated)
    const popular = await Product.find({
      isAvailable: true
    }).limit(4);

    res.json({
      success: true,
      pairingTitle: category === 'coffee' ? 'Perfect with Your Coffee 🥐' : 'Recommended Sips & Bites ☕',
      complementary,
      popular
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
