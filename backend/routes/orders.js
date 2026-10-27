const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Cart    = require('../models/Cart');
const { protect, adminOnly } = require('../middleware/auth');
const { deductOrderStock, restoreOrderStock } = require('./inventory');
const { applyCouponUsage } = require('./coupons');
const { awardOrderLoyaltyPoints, deductOrderLoyaltyPoints, refundOrderLoyaltyPoints } = require('./loyalty');
const {
  CAFE_LOCATION,
  OPERATING_HOURS,
  DELIVERY_CONFIG,
  estimateDeliveryDistance,
  calculateDeliveryFee,
  calculateEstimatedDeliveryMinutes,
  isWithinOperatingHours
} = require('../config/cafe');

// ============================================
// POST /api/orders/check-delivery
// Check delivery eligibility and fee for an address (Public/Protected)
// ============================================
router.post('/check-delivery', async (req, res) => {
  try {
    const { address, pincode, lat, lng, subtotal = 0 } = req.body;

    if (!address && !pincode && (!lat || !lng)) {
      return res.status(400).json({ success: false, message: 'Please provide address or pincode in Mumbai' });
    }

    const estimate = estimateDeliveryDistance({ address, pincode, lat, lng });
    const deliveryFee = estimate.isEligible ? calculateDeliveryFee(estimate.distanceKm, subtotal) : 0;
    const estimatedMinutes = estimate.isEligible ? calculateEstimatedDeliveryMinutes(estimate.distanceKm) : 0;

    res.json({
      success: true,
      eligible: estimate.isEligible,
      isEligible: estimate.isEligible,
      distanceKm: estimate.distanceKm,
      maxRadiusKm: DELIVERY_CONFIG.maxRadiusKm,
      deliveryFee,
      estimatedDeliveryMinutes: estimatedMinutes,
      areaMatched: estimate.area || 'Mumbai',
      cafeAddress: CAFE_LOCATION.address,
      message: estimate.isEligible
        ? `Delivery available! Distance: ~${estimate.distanceKm} km (Est. ~${estimatedMinutes} mins)`
        : `Sorry, we only deliver within 10 km of our Bandra West cafe. Distance to your address is ~${estimate.distanceKm} km.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// POST /api/orders
// Place a new order with verified pricing, Mumbai 10km limit, and advance scheduling
// ============================================
router.post('/', protect, async (req, res) => {
  try {
    const {
      items,
      fulfilmentType = 'pickup',
      shippingAddress = {},
      paymentMethod = 'Cash on Delivery',
      advanceOrder = {},
      tableDetails = {}
    } = req.body;

    const advance = (advanceOrder && (advanceOrder.isAdvance || advanceOrder.arrivalTime))
      ? advanceOrder
      : { isAdvance: req.body.isAdvance, arrivalTime: req.body.arrivalTime, notes: req.body.notes };

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your order contains no items' });
    }

    // 1. Verify items and recalculate trusted subtotal
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of items) {
      let trustedPrice = parseFloat(item.price);
      let productName = item.name;
      let productImage = item.image || 'images/menu-1.jpg';

      // Check DB if productId exists
      if (item.productId && item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        const prod = await Product.findById(item.productId);
        if (prod) {
          if (!prod.isAvailable) {
            return res.status(400).json({
              success: false,
              message: `"${prod.name}" is currently sold out. Please remove it to proceed.`
            });
          }
          trustedPrice = prod.price;
          productName = prod.name;
          productImage = prod.image;

          // Adjust size extra
          if (item.size && prod.customizations && prod.customizations.sizes) {
            const sizeObj = prod.customizations.sizes.find(s => s.name.toLowerCase() === item.size.toLowerCase());
            if (sizeObj && sizeObj.priceExtra) trustedPrice += sizeObj.priceExtra;
          }
        }
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSub = trustedPrice * qty;
      subtotal += itemSub;

      verifiedItems.push({
        productId: item.productId || item._id || '',
        name: productName,
        price: trustedPrice,
        quantity: qty,
        image: productImage,
        size: item.size || 'Regular',
        milk: item.milk || 'Standard',
        sugar: item.sugar || 'Normal'
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // 2. Handle Fulfilment Method
    let deliveryFee = 0;
    let deliveryData = { distanceKm: 0, deliveryFee: 0, estimatedMinutes: 30 };
    let advanceData = { isAdvance: false };
    let tableData = {};

    if (fulfilmentType === 'delivery') {
      const { address, city, pincode, phone } = shippingAddress;
      if (!address || address.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Please provide a valid delivery address in Mumbai' });
      }
      if (!phone || phone.trim().length < 8) {
        return res.status(400).json({ success: false, message: 'Please provide a contact phone number for delivery' });
      }

      // Check Mumbai 10 km radius
      const estimate = estimateDeliveryDistance({
        address,
        pincode,
        lat: shippingAddress.lat,
        lng: shippingAddress.lng
      });

      if (!estimate.isEligible) {
        return res.status(400).json({
          success: false,
          message: `Delivery unavailable: Your address is ~${estimate.distanceKm} km away. We deliver within a maximum 10 km radius from our Mumbai café.`
        });
      }

      deliveryFee = calculateDeliveryFee(estimate.distanceKm, subtotal);
      const estimatedMinutes = calculateEstimatedDeliveryMinutes(estimate.distanceKm);

      deliveryData = {
        distanceKm: estimate.distanceKm,
        deliveryFee,
        estimatedMinutes,
        targetDeliveryTime: new Date(Date.now() + estimatedMinutes * 60000)
      };
    } else if (fulfilmentType === 'pickup') {
      // Check Advance Coffee Ordering (~20 mins ahead)
      if (advance && advance.isAdvance && advance.arrivalTime) {
        const arrivalDate = new Date(advance.arrivalTime);
        const diffMinutes = Math.round((arrivalDate.getTime() - Date.now()) / 60000);

        if (isNaN(arrivalDate.getTime()) || diffMinutes < 15) {
          return res.status(400).json({
            success: false,
            message: 'Advance arrival time must be at least 15-20 minutes in advance.'
          });
        }
        if (!isWithinOperatingHours(arrivalDate)) {
          return res.status(400).json({
            success: false,
            message: `Selected arrival time is outside café operating hours (${OPERATING_HOURS.displayText}).`
          });
        }

        advanceData = {
          isAdvance: true,
          arrivalTime: arrivalDate,
          notes: advance.notes || ''
        };
      }
    } else if (fulfilmentType === 'dine_in') {
      tableData = {
        guests: parseInt(tableDetails.guests, 10) || 2,
        reservationTime: tableDetails.reservationTime || '',
        tableNumber: tableDetails.tableNumber || '',
        bookingId: tableDetails.bookingId || null
      };

      if (advanceOrder && advanceOrder.arrivalTime) {
        advanceData = {
          isAdvance: true,
          arrivalTime: new Date(advanceOrder.arrivalTime),
          notes: advanceOrder.notes || ''
        };
      }
    }

    // 3. Optional Discount & Coupon / Loyalty Points
    let discountAmount = 0;
    let appliedCoupon = '';
    let pointsRedeemedCount = 0;

    if (req.body.couponCode) {
      const Coupon = require('../models/Coupon');
      const cp = await Coupon.findOne({ code: req.body.couponCode.toUpperCase().trim(), isActive: true });
      if (cp && new Date() <= new Date(cp.expiryDate) && subtotal >= cp.minOrderValue) {
        let disc = cp.discountType === 'percentage' ? (subtotal * cp.discountValue) / 100 : cp.discountValue;
        if (cp.maxDiscount && disc > cp.maxDiscount) disc = cp.maxDiscount;
        disc = Math.min(subtotal, Math.round(disc * 100) / 100);
        discountAmount += disc;
        appliedCoupon = cp.code;
      }
    }

    if (req.body.pointsRedeemed && parseInt(req.body.pointsRedeemed, 10) > 0) {
      const User = require('../models/User');
      const u = await User.findById(req.user._id);
      const reqPts = parseInt(req.body.pointsRedeemed, 10);
      if (u && (u.loyaltyPoints || 0) >= reqPts) {
        const ptDiscount = await deductOrderLoyaltyPoints(u, reqPts, null);
        discountAmount += ptDiscount;
        pointsRedeemedCount = reqPts;
      }
    }

    const finalTotal = Math.max(0, Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100);

    // 4. Create Order
    const order = await Order.create({
      user: req.user._id,
      items: verifiedItems,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon,
      loyaltyPointsRedeemed: pointsRedeemedCount,
      totalAmount: finalTotal,
      fulfilmentType,
      status: 'pending',
      shippingAddress: fulfilmentType === 'delivery' ? shippingAddress : {},
      deliveryDetails: deliveryData,
      advanceOrder: advanceData,
      tableDetails: tableData,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        note: 'Order placed by customer',
        changedBy: 'customer'
      }],
      estimatedReadyTime: new Date(Date.now() + 20 * 60000) // ~20 min ready estimate
    });

    // 5. Track Coupon Usage if applicable
    if (appliedCoupon) {
      await applyCouponUsage(appliedCoupon, req.user._id, order._id, discountAmount);
    }

    // 6. Deduct initial inventory if Cash on Delivery / direct order
    if (paymentMethod === 'Cash on Delivery' || fulfilmentType === 'dine_in') {
      await deductOrderStock(order);
    }

    // 7. Clear user's Cart in database
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! ☕',
      order
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// GET /api/orders/my-orders
// Get authenticated customer's orders
// ============================================
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// GET /api/orders/:id
// Get single order (Customer ownership or Admin)
// ============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// PUT /api/orders/:id/cancel
// Customer cancels an order (only if pending or confirmed)
// ============================================
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Cancellation rule: Only allowed when pending or confirmed
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already "${order.status}". Please call the café at ${CAFE_LOCATION.phone}.`
      });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      note: req.body.reason || 'Cancelled by customer',
      changedBy: req.user.username || 'customer'
    });

    // Revert inventory & loyalty points if applicable
    await restoreOrderStock(order);
    await refundOrderLoyaltyPoints(order);

    await order.save();

    res.json({ success: true, message: 'Order has been cancelled.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// AUTHORIZED MANAGEMENT OPERATIONS (Admin Only)
// ============================================

// @route   GET /api/orders/all
// @desc    Get all orders across all customers (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status / preparation status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, estimatedReadyMinutes, note } = req.body;
    const allowed = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (estimatedReadyMinutes) {
      order.estimatedReadyTime = new Date(Date.now() + parseInt(estimatedReadyMinutes, 10) * 60000);
    }

    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status updated to ${status}`,
      changedBy: req.user.username || 'admin'
    });

    // Handle lifecycle side effects
    if (status === 'confirmed' || status === 'preparing') {
      await deductOrderStock(order);
    } else if (status === 'delivered' || status === 'completed') {
      await awardOrderLoyaltyPoints(order);
    } else if (status === 'cancelled') {
      await restoreOrderStock(order);
      await refundOrderLoyaltyPoints(order);
    }

    await order.save();

    res.json({ success: true, message: `Order status updated to "${status}"`, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
