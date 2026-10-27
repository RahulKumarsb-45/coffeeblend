const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

/* ── GET /api/cart ── */
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = { items: [], totalAmount: 0 };
    }
    res.json({ success: true, cart, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/cart/add ── */
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity = 1, size = 'Regular', milk = 'Standard', sugar = 'Normal' } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // Look up product in database to verify existence, genuine price, and availability
    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    } else {
      // Allow lookup by name or custom id if needed
      product = await Product.findOne({ name: new RegExp('^' + req.body.name + '$', 'i') });
    }

    // Determine genuine trusted base price
    let trustedPrice = 0;
    let productName = req.body.name || 'CoffeeBlend Item';
    let productImage = req.body.image || 'images/menu-1.jpg';

    if (product) {
      if (!product.isAvailable) {
        return res.status(400).json({ success: false, message: `"${product.name}" is currently unavailable.` });
      }
      trustedPrice = product.price;
      productName = product.name;
      productImage = product.image;

      // Check size extra price
      if (size && product.customizations && product.customizations.sizes) {
        const sizeObj = product.customizations.sizes.find(s => s.name.toLowerCase() === size.toLowerCase());
        if (sizeObj && sizeObj.priceExtra) {
          trustedPrice += sizeObj.priceExtra;
        }
      }
      // Check milk extra price
      if (milk && milk.includes('+₹')) {
        const extra = parseInt(milk.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(extra)) trustedPrice += extra;
      }
    } else if (req.body.price !== undefined && !isNaN(parseFloat(req.body.price))) {
      // Fallback for legacy custom items
      trustedPrice = parseFloat(req.body.price);
    } else {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    // Match item by productId AND customizations
    const existingIdx = cart.items.findIndex(i =>
      i.productId === String(productId) &&
      (i.size || 'Regular') === size &&
      (i.milk || 'Standard') === milk &&
      (i.sugar || 'Normal') === sugar
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += qty;
      cart.items[existingIdx].price = trustedPrice; // Ensure price stays trusted
    } else {
      cart.items.push({
        productId: String(productId),
        name: productName,
        price: trustedPrice,
        image: productImage,
        quantity: qty,
        size,
        milk,
        sugar
      });
    }

    cart.totalAmount = Math.round(cart.items.reduce((s, i) => s + (i.price * i.quantity), 0) * 100) / 100;
    await cart.save();

    res.json({ success: true, message: `${productName} added to cart! ☕`, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/cart/update/:itemId ── */
router.put('/update/:itemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const newQty = parseInt(quantity, 10);
    const itemIdx = cart.items.findIndex(i => (i._id && i._id.toString() === req.params.itemId) || i.productId === req.params.itemId);

    if (itemIdx >= 0) {
      if (newQty <= 0) {
        cart.items.splice(itemIdx, 1);
      } else {
        cart.items[itemIdx].quantity = newQty;
      }
    } else {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    cart.totalAmount = Math.round(cart.items.reduce((s, i) => s + (i.price * i.quantity), 0) * 100) / 100;
    await cart.save();

    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/cart/remove/:itemId ── */
router.delete('/remove/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => (i._id && i._id.toString() !== req.params.itemId) && i.productId !== req.params.itemId);
    cart.totalAmount = Math.round(cart.items.reduce((s, i) => s + (i.price * i.quantity), 0) * 100) / 100;
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', cart });
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
