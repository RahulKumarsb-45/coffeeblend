const express = require('express');
const router = express.Router();
const LoyaltyTransaction = require('../models/Loyalty');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Earning rule: 1 point per ₹10 spent on final paid/completed order
const POINTS_PER_INR = 0.1; // 1 pt = ₹10
const VALUE_PER_POINT = 1;  // 1 pt = ₹1 redemption discount

/* ── Helper: Award points on completed/delivered order ── */
async function awardOrderLoyaltyPoints(order) {
  if (!order || !order.user || order.loyaltyPointsEarned > 0) return;
  try {
    const eligibleAmount = order.totalAmount || 0;
    const earned = Math.floor(eligibleAmount * POINTS_PER_INR);
    if (earned <= 0) return;

    const user = await User.findById(order.user);
    if (!user) return;

    user.loyaltyPoints = (user.loyaltyPoints || 0) + earned;
    await user.save();

    await LoyaltyTransaction.create({
      user: user._id,
      order: order._id,
      points: earned,
      type: 'earned',
      description: `Earned on Order #${order._id.toString().slice(-6).toUpperCase()}`,
      balanceAfter: user.loyaltyPoints
    });

    order.loyaltyPointsEarned = earned;
    await order.save();
  } catch (err) {
    console.error('Loyalty award error:', err.message);
  }
}

/* ── Helper: Deduct points when redeemed at checkout ── */
async function deductOrderLoyaltyPoints(user, pointsToRedeem, orderId) {
  if (!user || pointsToRedeem <= 0) return 0;
  try {
    const currentPoints = user.loyaltyPoints || 0;
    const pts = Math.min(currentPoints, pointsToRedeem);
    if (pts <= 0) return 0;

    user.loyaltyPoints = currentPoints - pts;
    await user.save();

    await LoyaltyTransaction.create({
      user: user._id,
      order: orderId,
      points: -pts,
      type: 'redeemed',
      description: `Redeemed for ₹${pts * VALUE_PER_POINT} discount on Order #${orderId ? orderId.toString().slice(-6).toUpperCase() : ''}`,
      balanceAfter: user.loyaltyPoints
    });

    return pts * VALUE_PER_POINT;
  } catch (err) {
    console.error('Loyalty deduct error:', err.message);
    return 0;
  }
}

/* ── Helper: Revert loyalty points if order is cancelled ── */
async function refundOrderLoyaltyPoints(order) {
  if (!order || !order.user) return;
  try {
    const user = await User.findById(order.user);
    if (!user) return;

    // Restore redeemed points back to customer
    if (order.loyaltyPointsRedeemed > 0) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + order.loyaltyPointsRedeemed;
      await LoyaltyTransaction.create({
        user: user._id,
        order: order._id,
        points: order.loyaltyPointsRedeemed,
        type: 'refunded',
        description: `Restored points from cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
        balanceAfter: user.loyaltyPoints
      });
      order.loyaltyPointsRedeemed = 0;
    }

    // Revert earned points if they were awarded
    if (order.loyaltyPointsEarned > 0) {
      user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - order.loyaltyPointsEarned);
      await LoyaltyTransaction.create({
        user: user._id,
        order: order._id,
        points: -order.loyaltyPointsEarned,
        type: 'refunded',
        description: `Reverted points for cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
        balanceAfter: user.loyaltyPoints
      });
      order.loyaltyPointsEarned = 0;
    }

    await user.save();
    await order.save();
  } catch (err) {
    console.error('Loyalty refund error:', err.message);
  }
}

/* ── GET /api/loyalty/balance (Protected) ── */
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loyaltyPoints username');
    const transactions = await LoyaltyTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const points = user ? (user.loyaltyPoints || 0) : 0;
    res.json({
      success: true,
      points,
      rupeeValue: points * VALUE_PER_POINT,
      earningRate: '1 point per ₹10 spent',
      redemptionRate: '1 point = ₹1 discount',
      transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/loyalty/redeem (Protected) ── */
router.post('/redeem', protect, async (req, res) => {
  try {
    const { points, subtotal } = req.body;
    const requestedPoints = parseInt(points, 10);
    const sub = parseFloat(subtotal) || 0;

    if (isNaN(requestedPoints) || requestedPoints <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a positive points amount.' });
    }

    const user = await User.findById(req.user._id);
    const available = user.loyaltyPoints || 0;

    if (requestedPoints > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${available} points available.`
      });
    }

    // Max redemption cap: up to 50% of subtotal
    const maxRedeemablePoints = Math.floor(sub * 0.5);
    const finalPoints = Math.min(requestedPoints, maxRedeemablePoints);

    if (finalPoints <= 0) {
      return res.status(400).json({
        success: false,
        message: `Points can discount up to 50% of subtotal. Subtotal too low.`
      });
    }

    const discountAmount = finalPoints * VALUE_PER_POINT;

    res.json({
      success: true,
      pointsRedeemed: finalPoints,
      discountAmount,
      message: `Redeemed ${finalPoints} points for ₹${discountAmount} discount!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  router,
  awardOrderLoyaltyPoints,
  deductOrderLoyaltyPoints,
  refundOrderLoyaltyPoints
};
