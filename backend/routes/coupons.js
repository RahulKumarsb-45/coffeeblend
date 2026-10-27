const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

// Default initial promotional coupons
const DEFAULT_COUPONS = [
  {
    code: 'WELCOME50',
    description: '₹50 OFF on your order above ₹250',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 250,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    usageLimit: 500,
    perUserLimit: 1,
    isActive: true
  },
  {
    code: 'COFFEE15',
    description: '15% OFF on orders above ₹200 (up to ₹100 max discount)',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 200,
    maxDiscount: 100,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 1000,
    perUserLimit: 2,
    isActive: true
  }
];

async function seedDefaultCouponsIfEmpty() {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      await Coupon.insertMany(DEFAULT_COUPONS);
      console.log('✅ Default promotional coupons initialized');
    }
  } catch (err) {
    console.warn('Coupon seed notice:', err.message);
  }
}
seedDefaultCouponsIfEmpty();

/* ── Helper: Record coupon usage upon order completion ── */
async function applyCouponUsage(couponCode, userId, orderId, discountAmount) {
  if (!couponCode) return;
  try {
    await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase().trim() },
      {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            user: userId,
            orderId,
            discountApplied: discountAmount,
            usedAt: new Date()
          }
        }
      }
    );
  } catch (err) {
    console.error('Coupon usage record error:', err.message);
  }
}

/* ── POST /api/coupons/validate (Protected) ── */
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, subtotal = 0, fulfilmentType = 'pickup' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    // Check total usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum total redemptions.' });
    }

    // Check per-user limit
    const userUses = (coupon.usedBy || []).filter(u => u.user && u.user.toString() === req.user._id.toString()).length;
    if (userUses >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: `You have already used this coupon the maximum allowed (${coupon.perUserLimit}) time(s).` });
    }

    // Check minimum order value
    const orderSub = parseFloat(subtotal) || 0;
    if (orderSub < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for coupon ${coupon.code}. Current subtotal is ₹${orderSub}.`
      });
    }

    // Check fulfilment restriction
    if (coupon.fulfilmentRestriction !== 'all' && coupon.fulfilmentRestriction !== fulfilmentType) {
      return res.status(400).json({
        success: false,
        message: `Coupon ${coupon.code} is only valid for ${coupon.fulfilmentRestriction} orders.`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderSub * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(orderSub, Math.round(discount * 100) / 100);

    res.json({
      success: true,
      valid: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
      newSubtotal: Math.max(0, orderSub - discount),
      message: `Coupon "${coupon.code}" applied! You save ₹${discount}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/coupons/active (Public/Protected) ── */
router.get('/active', async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() }
    }).select('code description discountType discountValue minOrderValue maxDiscount expiryDate fulfilmentRestriction');

    res.json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/coupons/all (Admin only) ── */
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/coupons (Admin only) ── */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, perUserLimit, fulfilmentRestriction } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount value, and expiry date required.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue: parseFloat(discountValue),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxDiscount: parseFloat(maxDiscount) || 1000,
      expiryDate: new Date(expiryDate),
      usageLimit: parseInt(usageLimit, 10) || 500,
      perUserLimit: parseInt(perUserLimit, 10) || 1,
      fulfilmentRestriction: fulfilmentRestriction || 'all'
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/coupons/:id (Admin only) ── */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: `Coupon ${coupon.code} deactivated.`, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  router,
  applyCouponUsage
};
