const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const { protect } = require('../middleware/auth');

/* ── GET /api/cart ── */
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = { items: [], totalAmount: 0 };
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/cart/add ── */
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, name, price, quantity, image } = req.body;

    if (!productId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'productId, name and price are required' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    const idx = cart.items.findIndex(i => i.productId === productId);
    if (idx >= 0) {
      cart.items[idx].quantity += (parseInt(quantity) || 1);
    } else {
      cart.items.push({
        productId: productId,
        name:      name,
        price:     parseFloat(price),
        image:     image || 'images/menu-1.jpg',
        quantity:  parseInt(quantity) || 1
      });
    }

    cart.totalAmount = cart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    await cart.save();
    res.json({ success: true, message: 'Item added to cart!', cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/cart/update/:productId ── */
router.put('/update/:productId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const idx = cart.items.findIndex(i => i.productId === req.params.productId);
    if (idx >= 0) {
      if (parseInt(quantity) <= 0) cart.items.splice(idx, 1);
      else cart.items[idx].quantity = parseInt(quantity);
    }

    cart.totalAmount = cart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/cart/remove/:productId ── */
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.productId !== req.params.productId);
    cart.totalAmount = cart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    await cart.save();
    res.json({ success: true, message: 'Item removed', cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/cart/clear ── */
router.delete('/clear', protect, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
