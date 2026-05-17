const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

// POST /api/orders
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No items in order' });
    const totalAmount = items.reduce((t, i) => t + (i.price * i.quantity), 0);
    const order = await Order.create({
      user: req.user._id, items, totalAmount,
      shippingAddress, paymentMethod: paymentMethod || 'Cash on Delivery'
    });
    res.status(201).json({ success: true, message: 'Order placed! 🎉', order });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my-orders  ← MUST be before /:id
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: orders.length, orders });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, order });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
