const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

/* ── GET /api/analytics/overview (Admin only) ── */
router.get('/overview', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find();

    const totalOrders = orders.length;
    let completedOrders = 0;
    let pendingOrders = 0;
    let preparingOrders = 0;
    let cancelledOrders = 0;
    let eligibleRevenue = 0;

    const fulfilmentBreakdown = {
      pickup: 0,
      dine_in: 0,
      delivery: 0
    };

    orders.forEach(o => {
      if (o.status === 'completed' || o.status === 'delivered') {
        completedOrders++;
        eligibleRevenue += (o.totalAmount || 0);
      } else if (o.status === 'pending' || o.status === 'confirmed') {
        pendingOrders++;
      } else if (o.status === 'preparing' || o.status === 'ready' || o.status === 'out_for_delivery') {
        preparingOrders++;
      } else if (o.status === 'cancelled') {
        cancelledOrders++;
      }

      if (o.fulfilmentType && fulfilmentBreakdown[o.fulfilmentType] !== undefined) {
        fulfilmentBreakdown[o.fulfilmentType]++;
      }
    });

    eligibleRevenue = Math.round(eligibleRevenue * 100) / 100;
    const aov = completedOrders > 0 ? Math.round((eligibleRevenue / completedOrders) * 100) / 100 : 0;

    // Customer metrics
    const userOrderCounts = {};
    orders.forEach(o => {
      if (o.user) {
        const uid = o.user.toString();
        userOrderCounts[uid] = (userOrderCounts[uid] || 0) + 1;
      }
    });

    const uniqueCustomers = Object.keys(userOrderCounts).length;
    const repeatCustomers = Object.values(userOrderCounts).filter(count => count > 1).length;
    const repeatRate = uniqueCustomers > 0 ? ((repeatCustomers / uniqueCustomers) * 100).toFixed(1) + '%' : '0.0%';

    res.json({
      success: true,
      metrics: {
        totalOrders,
        completedOrders,
        pendingOrders,
        preparingOrders,
        cancelledOrders,
        eligibleRevenue,
        averageOrderValue: aov,
        fulfilmentBreakdown,
        customerInsights: {
          uniqueCustomers,
          repeatCustomers,
          repeatRate
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/analytics/products (Admin only) ── */
router.get('/products', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ status: { $nin: ['cancelled'] } });

    const productSales = {};
    const categoryRevenue = {};

    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.name || 'Coffee Item';
        const qty = item.quantity || 1;
        const rev = (item.price || 0) * qty;

        if (!productSales[name]) {
          productSales[name] = { name, quantitySold: 0, revenue: 0, image: item.image };
        }
        productSales[name].quantitySold += qty;
        productSales[name].revenue += rev;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 8);

    res.json({
      success: true,
      bestSellers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/analytics/demand (Admin only) ── */
router.get('/demand', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().select('createdAt fulfilmentType status totalAmount');

    // Aggregate by Day of Week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };

    // Aggregate by 3-hour blocks (Morning, Lunch, Afternoon, Evening, Night)
    const timeSlots = {
      'Morning (08:00 - 12:00)': 0,
      'Lunch (12:00 - 15:00)': 0,
      'Afternoon (15:00 - 18:00)': 0,
      'Evening (18:00 - 21:00)': 0,
      'Late Night (21:00 - 23:00)': 0
    };

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const dayName = days[d.getDay()];
      if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;

      const hour = d.getHours();
      if (hour >= 8 && hour < 12) timeSlots['Morning (08:00 - 12:00)']++;
      else if (hour >= 12 && hour < 15) timeSlots['Lunch (12:00 - 15:00)']++;
      else if (hour >= 15 && hour < 18) timeSlots['Afternoon (15:00 - 18:00)']++;
      else if (hour >= 18 && hour < 21) timeSlots['Evening (18:00 - 21:00)']++;
      else if (hour >= 21) timeSlots['Late Night (21:00 - 23:00)']++;
    });

    res.json({
      success: true,
      demandByDay: dayCounts,
      demandByTimeSlot: timeSlots,
      operationalTakeaways: [
        'Advance coffee scheduling reduces counter queuing during peak Morning (08:00-11:00) rush.',
        'Weekend evenings observe highest dine-in reservation and dessert pairings.',
        'Delivery volume peaks between 16:00 and 19:00 across Bandra West and Khar.'
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
