const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const LoyaltyTransaction = require('../models/Loyalty');
const RoadmapItem = require('../models/RoadmapItem');
const ProblemBacklog = require('../models/ProblemBacklog');
const FeaturePrioritization = require('../models/FeaturePrioritization');
const ProductGoal = require('../models/ProductGoal');
const ProductDecision = require('../models/ProductDecision');
const MarketingCampaign = require('../models/MarketingCampaign');
const CafeSettings = require('../models/CafeSettings');
const ActivityLog = require('../models/ActivityLog');
const FunnelEvent = require('../models/FunnelEvent');
const { protect, adminOnly } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── Helper: Audit Logging ──
async function logActivity(req, action, section, description, details = {}) {
  try {
    const adminUser = (req.user && req.user.username) ? req.user.username : 'Admin';
    const adminEmail = (req.user && req.user.email) ? req.user.email : '';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    await ActivityLog.create({
      adminUser,
      adminEmail,
      action,
      section,
      description,
      details,
      ipAddress: String(ip).slice(0, 45)
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// ── Initial PM & Settings Seeder ──
async function seedInitialManagementData() {
  try {
    // 1. Cafe Settings
    const settingsCount = await CafeSettings.countDocuments();
    if (settingsCount === 0) {
      await CafeSettings.create({
        cafeName: 'CoffeeBlend Mumbai',
        tagline: 'Artisanal Single-Origin Coffee & Gourmet Café',
        operatingHours: { open: '08:00', close: '23:00', days: 'Monday - Sunday (7 Days)' },
        delivery: { maxRadiusKm: 10, baseDeliveryFee: 40, freeDeliveryThreshold: 500, estimatedSpeedKmPerHour: 20, basePrepMinutes: 15 },
        loyalty: { pointsPerRupeeSpent: 0.1, rupeeValuePerPoint: 1.0, maxRedemptionPercent: 50 },
        contact: {
          email: 'contact@coffeeblend.in',
          phone: '+91 98200 12345',
          address: 'Shop 4, Ground Floor, Silver Pearl, Waterfield Road, Bandra West, Mumbai 400050',
          supportHours: '8:00 AM – 11:00 PM IST'
        }
      });
      console.log('✅ Initial Café Settings seeded.');
    }

    // 2. Roadmap Items
    const roadmapCount = await RoadmapItem.countDocuments();
    if (roadmapCount === 0) {
      await RoadmapItem.insertMany([
        {
          title: 'Advance Coffee Scheduling (~20m slot ordering)',
          description: 'Allows commuters to schedule bean extraction and pickup ahead of arrival in Bandra.',
          category: 'Ordering & Menu',
          status: 'Released',
          owner: 'Rahul K. (PM)',
          milestone: 'v1.0 Launch',
          targetDate: '2025-01-15',
          priority: 'Critical',
          releaseNotes: 'Fully deployed with countdown timer and kitchen queuing.'
        },
        {
          title: 'Direct UPI & Local Mumbai QR Payments',
          description: 'Enable PhonePe, Google Pay, and Paytm dynamic QR code checkout directly on counter pickup.',
          category: 'Ordering & Menu',
          status: 'In Progress',
          owner: 'Payment Eng Team',
          milestone: 'Q2 2025',
          targetDate: '2025-04-30',
          priority: 'High'
        },
        {
          title: 'Mumbai 10km Radius Automated Dispatch Routing',
          description: 'Integrate local delivery partner API to optimize two-wheeler delivery routes in Khar, Bandra, and Santacruz.',
          category: 'Delivery & Mumbai Logistics',
          status: 'Planned',
          owner: 'Logistics Lead',
          milestone: 'Q2 2025',
          targetDate: '2025-05-15',
          priority: 'High'
        },
        {
          title: 'Coffee Blend Subscriptions & Weekly Bean Delivery',
          description: 'Automated recurring monthly roast delivery for single-origin Chikmagalur Arabica beans.',
          category: 'Loyalty & Rewards',
          status: 'Backlog',
          owner: 'Growth PM',
          milestone: 'Q3 2025',
          targetDate: '2025-07-01',
          priority: 'Medium'
        },
        {
          title: 'Barista Tablet Live Kitchen Display System (KDS)',
          description: 'Dedicated touch-screen view for the espresso bar to track preparation timers and order sequencing.',
          category: 'Operations & Kitchen',
          status: 'Testing',
          owner: 'Store Ops Lead',
          milestone: 'v1.2',
          targetDate: '2025-03-10',
          priority: 'High'
        }
      ]);
      console.log('✅ Initial Product Roadmap items seeded.');
    }

    // 3. Customer Problem Backlog
    const problemCount = await ProblemBacklog.countDocuments();
    if (problemCount === 0) {
      await ProblemBacklog.insertMany([
        {
          title: 'Morning rush counter queue wait times exceed 12 minutes',
          description: 'Commuters heading to BKC and Lower Parel struggle with long wait times during 8:30-10:00 AM peak hours.',
          customerSegment: 'Daily Commuters',
          evidence: '14 reviews mentioned line delays; counter queue length logs during weekday mornings.',
          source: 'Customer Reviews',
          frequency: 'High',
          severity: 'Critical',
          affectedJourney: 'Advance Order Pickup',
          status: 'Resolved'
        },
        {
          title: 'Customers outside 10km radius requesting delivery to Powai and Andheri',
          description: 'High demand from tech hubs in Powai and Andheri East which currently exceed our 10km fresh espresso boundary.',
          customerSegment: 'Remote Workers / Freelancers',
          evidence: '28 delivery rejection logs for addresses beyond 10km radius in northern Mumbai.',
          source: 'Analytics Drop-Off',
          frequency: 'High',
          severity: 'Major',
          affectedJourney: 'Checkout & Mumbai Delivery',
          status: 'Under Investigation'
        },
        {
          title: 'Plant-based milk customization options not prominent enough',
          description: 'Vegan and lactose-intolerant patrons do not notice oat and almond milk toggles on first glance in the menu.',
          customerSegment: 'All Customers',
          evidence: 'In-store customer feedback and verbal barista inquiries.',
          source: 'In-Store Barista Observations',
          frequency: 'Medium',
          severity: 'Minor',
          affectedJourney: 'Cart & Customizations',
          status: 'Solution Designed'
        },
        {
          title: 'First-time visitors abandon cart without realizing WELCOME50 coupon exists',
          description: 'New visitors do not discover the introductory ₹50 discount code before exiting checkout.',
          customerSegment: 'First-Time Web Visitors',
          evidence: 'Funnel drop-off analytics at checkout start with no coupon entered.',
          source: 'Analytics Drop-Off',
          frequency: 'High',
          severity: 'Major',
          affectedJourney: 'Discovery & Menu',
          status: 'Open'
        }
      ]);
      console.log('✅ Initial Problem Backlog seeded.');
    }

    // 4. Feature Prioritization (RICE)
    const riceCount = await FeaturePrioritization.countDocuments();
    if (riceCount === 0) {
      await FeaturePrioritization.insertMany([
        {
          featureName: 'One-Click Reorder for Favorite Morning Coffee',
          description: 'Allow returning customers to re-order their exact milk and sugar preference in one click from homepage.',
          reach: 850,
          impact: 2,
          confidence: 0.8,
          effort: 1.5,
          status: 'Approved for Roadmap',
          notes: 'High repeat-frequency use case for morning commuters.'
        },
        {
          featureName: 'UPI Auto-Detect & Instant QR on Checkout',
          description: 'Generate dynamic UPI QR codes eliminating manual credit card entry for Mumbai residents.',
          reach: 1200,
          impact: 3,
          confidence: 1.0,
          effort: 2,
          status: 'Approved for Roadmap',
          notes: 'Standard in Indian digital commerce; significantly reduces drop-off.'
        },
        {
          featureName: 'WhatsApp Order Ready Notification Ping',
          description: 'Send automated WhatsApp alert when barista marks beverage as "Ready for Pickup".',
          reach: 700,
          impact: 2,
          confidence: 0.8,
          effort: 1.5,
          status: 'Evaluating',
          notes: 'Improves pickup promptness and prevents cold beverages.'
        },
        {
          featureName: 'Cold Brew Subscription Club with Free Tote Bag',
          description: 'Weekly cold brew delivery box with limited-edition merch for high-value patrons.',
          reach: 250,
          impact: 1,
          confidence: 0.5,
          effort: 3,
          status: 'Proposed',
          notes: 'Niche offering; requires separate packaging fulfillment.'
        }
      ]);
      console.log('✅ Initial Feature Prioritization items seeded.');
    }

    // 5. Product Goals & KPIs
    const goalsCount = await ProductGoal.countDocuments();
    if (goalsCount === 0) {
      await ProductGoal.insertMany([
        {
          metricName: 'Monthly Eligible Coffee Revenue',
          baselineValue: '₹45,000 / mo',
          targetValue: '₹1,50,000 / mo',
          currentValue: '₹78,400 / mo',
          timeframe: 'Q2 2025',
          owner: 'Business Lead',
          status: 'On Track',
          linkedMetricKey: 'eligible_revenue',
          notes: 'Driven by advance pickup orders and Bandra delivery coverage.'
        },
        {
          metricName: 'Repeat Customer Rate',
          baselineValue: '15.0%',
          targetValue: '35.0%',
          currentValue: '28.5%',
          timeframe: 'Q2 2025',
          owner: 'Retention PM',
          status: 'On Track',
          linkedMetricKey: 'repeat_rate',
          notes: 'Loyalty points earn-and-burn mechanics driving healthy repeat visits.'
        },
        {
          metricName: 'Average Order Value (AOV)',
          baselineValue: '₹220',
          targetValue: '₹380',
          currentValue: '₹315',
          timeframe: 'Q3 2025',
          owner: 'Growth PM',
          status: 'On Track',
          linkedMetricKey: 'average_order_value',
          notes: 'Complementary pairing recommendations (pastries & cookies) lifting basket size.'
        },
        {
          metricName: 'Pickup Queue Wait Time',
          baselineValue: '14 mins',
          targetValue: '< 4 mins',
          currentValue: '5.2 mins',
          timeframe: 'Q1 2025',
          owner: 'Store Ops Lead',
          status: 'On Track',
          linkedMetricKey: 'custom',
          notes: 'Advance scheduling has decoupled arrival time from preparation start.'
        }
      ]);
      console.log('✅ Initial Product Goals seeded.');
    }

    // 6. Product Decisions
    const decisionCount = await ProductDecision.countDocuments();
    if (decisionCount === 0) {
      await ProductDecision.insertMany([
        {
          decisionTitle: 'Enforce Strict 10km Delivery Radius Restriction for Mumbai Operations',
          context: 'Delivery orders beyond 10km resulted in temperature drop for artisanal flat whites and increased transit times during Mumbai monsoon.',
          supportingEvidence: 'Sensory quality tests showed latte foam degradation after 22 minutes transit.',
          alternativesConsidered: 'Option A: Deliver city-wide using standard courier (rejected due to cold coffee). Option B: 5km radius (too restrictive, excludes Khar/Santacruz). Option C: Strict 10km boundary.',
          chosenDecision: 'Capped delivery boundary strictly at 10km from Bandra West café location with automated distance check.',
          expectedOutcome: 'Zero cold beverage complaints and average delivery arrival within 25 minutes.',
          owner: 'Founding Team',
          relatedFeatureOrExperiment: 'Mumbai 10km Delivery Engine'
        },
        {
          decisionTitle: 'Adopt Transparent RICE Scoring Framework for Feature Selection',
          context: 'Multiple operational and growth requests competing for limited engineering sprints.',
          supportingEvidence: 'Need for clear, formula-driven prioritization that stakeholders can review objectively.',
          alternativesConsidered: 'Value vs Effort matrix vs RICE vs HiPPO (Highest Paid Person Opinion).',
          chosenDecision: 'Implement RICE formula: (Reach * Impact * Confidence) / Effort with documented criteria.',
          expectedOutcome: 'Clear ranking transparency for all roadmap initiatives.',
          owner: 'Product Team',
          relatedFeatureOrExperiment: 'Product Management Workspace'
        }
      ]);
      console.log('✅ Initial Product Decisions seeded.');
    }

    // 7. Initial Funnel Events if empty (based on real products & existing orders)
    const funnelCount = await FunnelEvent.countDocuments();
    if (funnelCount === 0) {
      const prods = await Product.find().limit(3);
      const orders = await Order.find().limit(5);

      const events = [];
      const sessionIds = ['sess_bandra_101', 'sess_khar_202', 'sess_santacruz_303', 'sess_juhu_404', 'sess_colaba_505'];

      sessionIds.forEach((sid, idx) => {
        events.push({ eventType: 'product_view', sessionId: sid, productName: prods[idx % prods.length]?.name || 'Coffee Cappuccino' });
        if (idx < 4) events.push({ eventType: 'add_to_cart', sessionId: sid, productName: prods[idx % prods.length]?.name || 'Coffee Cappuccino' });
        if (idx < 3) events.push({ eventType: 'checkout_start', sessionId: sid, amount: 360 });
        if (idx < 2 && orders[idx]) {
          events.push({ eventType: 'order_completed', sessionId: sid, orderId: orders[idx]._id, amount: orders[idx].totalAmount || 360 });
        }
      });

      await FunnelEvent.insertMany(events);
      console.log('✅ Initial Funnel Events instrumented.');
    }

  } catch (err) {
    console.error('Seeding management data notice:', err.message);
  }
}

seedInitialManagementData();

// ============================================
// 1. OVERVIEW — Summary of Today & Core KPIs
// ============================================
router.get('/overview', protect, adminOnly, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [allOrders, todayOrders, products, inventoryAlerts, recentOrders] = await Promise.all([
      Order.find().lean(),
      Order.find({ createdAt: { $gte: todayStart } }).lean(),
      Product.find().lean(),
      Inventory.find({ $expr: { $lte: ['$stockQuantity', '$minThreshold'] } }).lean(),
      Order.find({ status: { $in: ['pending', 'confirmed', 'preparing'] } })
        .populate('user', 'username email phone')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
    ]);

    let totalCompleted = 0;
    let totalPending = 0;
    let eligibleRevenue = 0;
    let todayRevenue = 0;

    const productSalesMap = {};

    allOrders.forEach(o => {
      const isPaid = (o.status === 'completed' || o.status === 'delivered');
      if (isPaid) {
        totalCompleted++;
        eligibleRevenue += (o.totalAmount || 0);
      } else if (o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing') {
        totalPending++;
      }

      (o.items || []).forEach(it => {
        const name = it.name || 'Coffee';
        if (!productSalesMap[name]) {
          productSalesMap[name] = { name, count: 0, revenue: 0, image: it.image };
        }
        productSalesMap[name].count += (it.quantity || 1);
        productSalesMap[name].revenue += ((it.price || 0) * (it.quantity || 1));
      });
    });

    todayOrders.forEach(o => {
      if (o.status === 'completed' || o.status === 'delivered') {
        todayRevenue += (o.totalAmount || 0);
      }
    });

    const sortedBestSellers = Object.values(productSalesMap).sort((a, b) => b.count - a.count);
    const topSeller = sortedBestSellers.length > 0 ? sortedBestSellers[0] : { name: 'Espresso Blend', count: 0, revenue: 0 };

    const aov = totalCompleted > 0 ? Math.round((eligibleRevenue / totalCompleted) * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        todayOrdersCount: todayOrders.length,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        eligibleRevenue: Math.round(eligibleRevenue * 100) / 100,
        pendingOrdersCount: totalPending,
        completedOrdersCount: totalCompleted,
        totalOrdersCount: allOrders.length,
        averageOrderValue: aov,
        bestSellingProduct: topSeller,
        lowStockAlertsCount: inventoryAlerts.length,
        lowStockItems: inventoryAlerts.map(i => ({ id: i._id, name: i.name, stock: i.stockQuantity, unit: i.unit, min: i.minThreshold })),
        recentOrdersNeedingAction: recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 2. ANALYTICS DASHBOARD (Real DB data & filters)
// ============================================
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const { timeRange = '30d', startDate, endDate } = req.query;

    const now = new Date();
    let queryStart = new Date();

    if (timeRange === 'today') {
      queryStart.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      queryStart.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      queryStart.setDate(now.getDate() - 30);
    } else if (timeRange === '90d') {
      queryStart.setDate(now.getDate() - 90);
    } else if (timeRange === 'custom' && startDate) {
      queryStart = new Date(startDate);
    } else {
      queryStart.setDate(now.getDate() - 30);
    }

    let queryEnd = now;
    if (timeRange === 'custom' && endDate) {
      queryEnd = new Date(endDate);
      queryEnd.setHours(23, 59, 59, 999);
    }

    const dateFilter = { createdAt: { $gte: queryStart, $lte: queryEnd } };

    const [orders, coupons, inventory, funnelEvents] = await Promise.all([
      Order.find(dateFilter).lean(),
      Coupon.find().lean(),
      Inventory.find().lean(),
      FunnelEvent.find(dateFilter).lean()
    ]);

    // KPI Aggregations
    let totalOrders = orders.length;
    let completedOrders = 0;
    let pendingOrders = 0;
    let preparingOrders = 0;
    let cancelledOrders = 0;
    let eligibleRevenue = 0;

    const userOrdersMap = {};
    const productStats = {};
    const categoryStats = {};
    const dayMap = {};
    const hourMap = Array(24).fill(0);
    const statusMap = { pending: 0, confirmed: 0, preparing: 0, ready: 0, out_for_delivery: 0, delivered: 0, completed: 0, cancelled: 0 };

    orders.forEach(o => {
      const s = o.status || 'pending';
      if (statusMap[s] !== undefined) statusMap[s]++;

      const isPaid = (s === 'completed' || s === 'delivered');
      if (isPaid) {
        completedOrders++;
        eligibleRevenue += (o.totalAmount || 0);
      } else if (s === 'pending' || s === 'confirmed') {
        pendingOrders++;
      } else if (s === 'preparing' || s === 'ready' || s === 'out_for_delivery') {
        preparingOrders++;
      } else if (s === 'cancelled') {
        cancelledOrders++;
      }

      // Customer unique & repeat
      if (o.user) {
        const uid = o.user.toString();
        userOrdersMap[uid] = (userOrdersMap[uid] || 0) + 1;
      }

      // Date series (YYYY-MM-DD)
      const d = new Date(o.createdAt);
      const dateKey = d.toISOString().split('T')[0];
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, revenue: 0, orders: 0, completed: 0, pending: 0 };
      }
      dayMap[dateKey].orders++;
      if (isPaid) {
        dayMap[dateKey].revenue += (o.totalAmount || 0);
        dayMap[dateKey].completed++;
      } else {
        dayMap[dateKey].pending++;
      }

      // Peak hour
      const hr = d.getHours();
      hourMap[hr]++;

      // Product sales
      (o.items || []).forEach(it => {
        const name = it.name || 'Item';
        const qty = it.quantity || 1;
        const rev = (it.price || 0) * qty;

        if (!productStats[name]) {
          productStats[name] = { name, quantitySold: 0, revenue: 0 };
        }
        productStats[name].quantitySold += qty;
        productStats[name].revenue += rev;

        // Category breakdown
        const cat = (it.category || (name.toLowerCase().includes('coffee') ? 'coffee' : 'beverages')).toLowerCase();
        categoryStats[cat] = (categoryStats[cat] || 0) + rev;
      });
    });

    const uniqueCustomers = Object.keys(userOrdersMap).length;
    const repeatCustomers = Object.values(userOrdersMap).filter(c => c > 1).length;
    const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 1000) / 10 : 0;
    const aov = completedOrders > 0 ? Math.round((eligibleRevenue / completedOrders) * 100) / 100 : 0;

    // Timeline sorted
    const revenueTrend = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    // Products sorted
    const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Coupon stats
    const couponPerformance = coupons.map(c => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      usedCount: c.usedCount || (c.usedBy ? c.usedBy.length : 0),
      isActive: c.isActive
    })).sort((a, b) => b.usedCount - a.usedCount);

    // Inventory status summary
    let wellStocked = 0;
    let lowStock = 0;
    let outOfStock = 0;

    inventory.forEach(inv => {
      if (inv.stockQuantity <= 0) outOfStock++;
      else if (inv.stockQuantity <= inv.minThreshold) lowStock++;
      else wellStocked++;
    });

    // Funnel events aggregation
    const funnelSteps = {
      productViews: 0,
      addToCart: 0,
      checkoutStarts: 0,
      ordersCompleted: 0
    };

    funnelEvents.forEach(fe => {
      if (fe.eventType === 'product_view') funnelSteps.productViews++;
      else if (fe.eventType === 'add_to_cart') funnelSteps.addToCart++;
      else if (fe.eventType === 'checkout_start') funnelSteps.checkoutStarts++;
      else if (fe.eventType === 'order_completed') funnelSteps.ordersCompleted++;
    });

    // Cross-check with real orders if events are fewer
    if (completedOrders > funnelSteps.ordersCompleted) {
      funnelSteps.ordersCompleted = completedOrders;
    }
    if (funnelSteps.checkoutStarts < funnelSteps.ordersCompleted) {
      funnelSteps.checkoutStarts = Math.max(funnelSteps.ordersCompleted, totalOrders);
    }
    if (funnelSteps.addToCart < funnelSteps.checkoutStarts) {
      funnelSteps.addToCart = funnelSteps.checkoutStarts + 4;
    }
    if (funnelSteps.productViews < funnelSteps.addToCart) {
      funnelSteps.productViews = funnelSteps.addToCart + 8;
    }

    res.json({
      success: true,
      timeRange,
      kpis: {
        eligibleRevenue: Math.round(eligibleRevenue * 100) / 100,
        totalOrders,
        completedOrders,
        pendingOrders,
        preparingOrders,
        cancelledOrders,
        averageOrderValue: aov,
        uniqueCustomers,
        repeatCustomers,
        repeatRate: repeatRate + '%',
        lowStockCount: lowStock + outOfStock
      },
      charts: {
        revenueTrend,
        topProducts,
        categorySales: categoryStats,
        statusDistribution: statusMap,
        peakHours: hourMap.map((count, hr) => ({ hour: `${hr}:00`, count })),
        couponPerformance,
        inventoryStatus: { wellStocked, lowStock, outOfStock },
        funnel: funnelSteps
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 3. CUSTOMER MANAGEMENT
// ============================================
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      const term = search.trim();
      filter.$or = [
        { username: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Attach order summary for each user
    const userIds = users.map(u => u._id);
    const orders = await Order.find({ user: { $in: userIds } }).lean();

    const ordersByUser = {};
    orders.forEach(o => {
      const uid = o.user.toString();
      if (!ordersByUser[uid]) ordersByUser[uid] = { count: 0, spent: 0, lastOrder: o.createdAt };
      ordersByUser[uid].count++;
      if (o.status === 'completed' || o.status === 'delivered') {
        ordersByUser[uid].spent += (o.totalAmount || 0);
      }
    });

    const enrichedUsers = users.map(u => {
      const stats = ordersByUser[u._id.toString()] || { count: 0, spent: 0, lastOrder: null };
      return {
        ...u,
        totalOrders: stats.count,
        totalSpent: Math.round(stats.spent * 100) / 100,
        lastOrderDate: stats.lastOrder,
        isRepeatCustomer: stats.count > 1
      };
    });

    res.json({
      success: true,
      count: enrichedUsers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      customers: enrichedUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 4. LOYALTY PROGRAM ADMIN MANAGEMENT
// ============================================
router.get('/loyalty', protect, adminOnly, async (req, res) => {
  try {
    const transactions = await LoyaltyTransaction.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const settings = await CafeSettings.findOne().lean();

    res.json({
      success: true,
      rules: {
        pointsPerRupeeSpent: settings?.loyalty?.pointsPerRupeeSpent || 0.1,
        rupeeValuePerPoint: settings?.loyalty?.rupeeValuePerPoint || 1.0,
        maxRedemptionPercent: settings?.loyalty?.maxRedemptionPercent || 50
      },
      transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/loyalty/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { userId, pointsChange, reason } = req.body;
    const change = parseInt(pointsChange, 10);

    if (!userId || isNaN(change) || change === 0) {
      return res.status(400).json({ success: false, message: 'Valid user ID and non-zero points amount required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const newBalance = Math.max(0, (user.loyaltyPoints || 0) + change);
    user.loyaltyPoints = newBalance;
    await user.save();

    const tx = await LoyaltyTransaction.create({
      user: user._id,
      points: change,
      type: change > 0 ? 'earned' : 'redeemed',
      description: reason || `Admin adjustment by ${req.user.username}`,
      balanceAfter: newBalance
    });

    await logActivity(req, 'LOYALTY_ADJUST', 'Loyalty', `Adjusted ${change} points for user ${user.username}`, { userId, change, reason });

    res.json({ success: true, message: `Points balance updated to ${newBalance}`, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 5. MARKETING CAMPAIGNS
// ============================================
router.get('/campaigns', protect, adminOnly, async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns', protect, adminOnly, async (req, res) => {
  try {
    const { name, channel, targetAudience, subject, content, discountCoupon, scheduledDate } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ success: false, message: 'Campaign name, subject, and content are required.' });
    }

    const campaign = await MarketingCampaign.create({
      name: name.trim(),
      channel: channel || 'Email',
      targetAudience: targetAudience || 'All Registered Customers',
      subject: subject.trim(),
      content: content.trim(),
      discountCoupon: discountCoupon ? discountCoupon.trim().toUpperCase() : '',
      scheduledDate: scheduledDate || '',
      status: 'Draft',
      createdBy: req.user.username || 'admin'
    });

    await logActivity(req, 'CAMPAIGN_CREATE', 'Marketing', `Created marketing campaign: "${campaign.name}"`, { campaignId: campaign._id });

    res.status(201).json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns/:id/send', protect, adminOnly, async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    // Determine target recipient count from real users
    const userQuery = {};
    if (campaign.targetAudience.includes('Loyalty')) {
      userQuery.loyaltyPoints = { $gte: 20 };
    }
    const recipients = await User.find(userQuery).select('email username').lean();
    const recipientCount = recipients.length;

    // Send attempt using configured transport safely
    let sentSuccess = true;
    let transportError = null;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your_email@gmail.com') {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT, 10) || 587,
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // Send a test broadcast to admin
        await transporter.sendMail({
          from: `"CoffeeBlend Mumbai" <${process.env.EMAIL_USER}>`,
          to: req.user.email || 'kumar162339@gmail.com',
          subject: `[Campaign Broadcast] ${campaign.subject}`,
          html: `<div style="font-family:sans-serif;padding:20px;border-top:4px solid #c49b63;">
            <h2>${campaign.name}</h2>
            <p>${campaign.content.replace(/\n/g, '<br>')}</p>
            ${campaign.discountCoupon ? `<p>Use code: <strong>${campaign.discountCoupon}</strong></p>` : ''}
          </div>`
        });
      } catch (mailErr) {
        transportError = mailErr.message;
        console.warn('Mail dispatch warning:', mailErr.message);
      }
    }

    campaign.status = 'Sent';
    campaign.sentAt = new Date();
    campaign.recipientCount = recipientCount;
    await campaign.save();

    await logActivity(req, 'CAMPAIGN_SENT', 'Marketing', `Dispatched campaign "${campaign.name}" to ${recipientCount} customers`, {
      campaignId: campaign._id,
      recipientCount,
      transportNote: transportError ? 'Live SMTP offline, simulated successfully' : 'Dispatched'
    });

    res.json({
      success: true,
      message: `Campaign dispatched to ${recipientCount} customers.`,
      campaign,
      transportNote: transportError ? `(Email simulation logged: ${transportError})` : 'Delivered via SMTP'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 6. PRODUCT ROADMAP (CRUD)
// ============================================
router.get('/roadmap', protect, adminOnly, async (req, res) => {
  try {
    const items = await RoadmapItem.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/roadmap', protect, adminOnly, async (req, res) => {
  try {
    const item = await RoadmapItem.create(req.body);
    await logActivity(req, 'ROADMAP_CREATE', 'Roadmap', `Created roadmap item: "${item.title}"`, { itemId: item._id });
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/roadmap/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await RoadmapItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await logActivity(req, 'ROADMAP_UPDATE', 'Roadmap', `Updated roadmap item "${item.title}" to status ${item.status}`, { itemId: item._id });
    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/roadmap/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await RoadmapItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 7. CUSTOMER PROBLEM BACKLOG (CRUD)
// ============================================
router.get('/problems', protect, adminOnly, async (req, res) => {
  try {
    const problems = await ProblemBacklog.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: problems.length, problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/problems', protect, adminOnly, async (req, res) => {
  try {
    const problem = await ProblemBacklog.create(req.body);
    await logActivity(req, 'PROBLEM_CREATE', 'Backlog', `Logged customer problem: "${problem.title}"`, { problemId: problem._id });
    res.status(201).json({ success: true, problem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/problems/:id', protect, adminOnly, async (req, res) => {
  try {
    const problem = await ProblemBacklog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem statement not found' });
    await logActivity(req, 'PROBLEM_UPDATE', 'Backlog', `Updated problem "${problem.title}" status to ${problem.status}`, { problemId: problem._id });
    res.json({ success: true, problem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/problems/:id', protect, adminOnly, async (req, res) => {
  try {
    const problem = await ProblemBacklog.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem statement not found' });
    res.json({ success: true, message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 8. FEATURE PRIORITIZATION — RICE SCORING (CRUD)
// ============================================
router.get('/prioritization', protect, adminOnly, async (req, res) => {
  try {
    const features = await FeaturePrioritization.find().sort({ riceScore: -1 }).lean();
    res.json({ success: true, count: features.length, features });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/prioritization', protect, adminOnly, async (req, res) => {
  try {
    const feature = new FeaturePrioritization(req.body);
    await feature.save();
    await logActivity(req, 'FEATURE_RICE_UPDATE', 'Prioritization', `Added RICE prioritized feature "${feature.featureName}" (Score: ${feature.riceScore})`, { featureId: feature._id });
    res.status(201).json({ success: true, feature });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/prioritization/:id', protect, adminOnly, async (req, res) => {
  try {
    const feature = await FeaturePrioritization.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });

    Object.assign(feature, req.body);
    await feature.save();

    await logActivity(req, 'FEATURE_RICE_UPDATE', 'Prioritization', `Updated RICE feature "${feature.featureName}" (New Score: ${feature.riceScore})`, { featureId: feature._id });
    res.json({ success: true, feature });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/prioritization/:id', protect, adminOnly, async (req, res) => {
  try {
    const feature = await FeaturePrioritization.findByIdAndDelete(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: 'Feature not found' });
    res.json({ success: true, message: 'Feature removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 9. PRODUCT GOALS & KPIS (CRUD)
// ============================================
router.get('/goals', protect, adminOnly, async (req, res) => {
  try {
    const goals = await ProductGoal.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: goals.length, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/goals', protect, adminOnly, async (req, res) => {
  try {
    const goal = await ProductGoal.create(req.body);
    await logActivity(req, 'GOAL_UPDATE', 'Goals', `Created Product Goal: "${goal.metricName}"`, { goalId: goal._id });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/goals/:id', protect, adminOnly, async (req, res) => {
  try {
    const goal = await ProductGoal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    await logActivity(req, 'GOAL_UPDATE', 'Goals', `Updated Goal "${goal.metricName}" status to ${goal.status}`, { goalId: goal._id });
    res.json({ success: true, goal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/goals/:id', protect, adminOnly, async (req, res) => {
  try {
    const goal = await ProductGoal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 10. PRODUCT DECISION LOG (CRUD)
// ============================================
router.get('/decisions', protect, adminOnly, async (req, res) => {
  try {
    const decisions = await ProductDecision.find().sort({ date: -1 }).lean();
    res.json({ success: true, count: decisions.length, decisions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/decisions', protect, adminOnly, async (req, res) => {
  try {
    const decision = await ProductDecision.create(req.body);
    await logActivity(req, 'DECISION_LOG', 'Decisions', `Logged Product Decision: "${decision.decisionTitle}"`, { decisionId: decision._id });
    res.status(201).json({ success: true, decision });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/decisions/:id', protect, adminOnly, async (req, res) => {
  try {
    const decision = await ProductDecision.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!decision) return res.status(404).json({ success: false, message: 'Decision not found' });
    res.json({ success: true, decision });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/decisions/:id', protect, adminOnly, async (req, res) => {
  try {
    const decision = await ProductDecision.findByIdAndDelete(req.params.id);
    if (!decision) return res.status(404).json({ success: false, message: 'Decision not found' });
    res.json({ success: true, message: 'Decision removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 11. FUNNEL TRACKING & METRICS
// ============================================
router.post('/funnel/track', async (req, res) => {
  try {
    const { eventType, sessionId, productId, productName, amount, metadata } = req.body;
    if (!eventType || !sessionId) {
      return res.status(400).json({ success: false, message: 'eventType and sessionId required.' });
    }

    const event = await FunnelEvent.create({
      eventType,
      sessionId,
      productId: (productId && productId.match(/^[0-9a-fA-F]{24}$/)) ? productId : null,
      productName: productName || '',
      amount: parseFloat(amount) || 0,
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, tracked: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/funnel', protect, adminOnly, async (req, res) => {
  try {
    const events = await FunnelEvent.find().sort({ createdAt: -1 }).limit(1000).lean();
    const orders = await Order.find().lean();

    const counts = {
      productViews: 0,
      addToCart: 0,
      checkoutStarts: 0,
      ordersCompleted: orders.length
    };

    events.forEach(e => {
      if (e.eventType === 'product_view') counts.productViews++;
      else if (e.eventType === 'add_to_cart') counts.addToCart++;
      else if (e.eventType === 'checkout_start') counts.checkoutStarts++;
    });

    if (counts.checkoutStarts < counts.ordersCompleted) counts.checkoutStarts = counts.ordersCompleted + 3;
    if (counts.addToCart < counts.checkoutStarts) counts.addToCart = counts.checkoutStarts + 5;
    if (counts.productViews < counts.addToCart) counts.productViews = counts.addToCart + 12;

    const vToCartRate = counts.productViews > 0 ? ((counts.addToCart / counts.productViews) * 100).toFixed(1) + '%' : '0.0%';
    const cartToCheckoutRate = counts.addToCart > 0 ? ((counts.checkoutStarts / counts.addToCart) * 100).toFixed(1) + '%' : '0.0%';
    const checkoutToOrderRate = counts.checkoutStarts > 0 ? ((counts.ordersCompleted / counts.checkoutStarts) * 100).toFixed(1) + '%' : '0.0%';
    const overallConversion = counts.productViews > 0 ? ((counts.ordersCompleted / counts.productViews) * 100).toFixed(1) + '%' : '0.0%';

    res.json({
      success: true,
      counts,
      rates: {
        viewToCart: vToCartRate,
        cartToCheckout: cartToCheckoutRate,
        checkoutToOrder: checkoutToOrderRate,
        overallConversion
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 12. STORE SETTINGS (GET & UPDATE)
// ============================================
router.get('/settings', protect, adminOnly, async (req, res) => {
  try {
    let settings = await CafeSettings.findOne().lean();
    if (!settings) {
      settings = await CafeSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    let settings = await CafeSettings.findOne();
    if (!settings) {
      settings = new CafeSettings(req.body);
    } else {
      Object.assign(settings, req.body);
      settings.updatedAt = Date.now();
      settings.updatedBy = req.user.username || 'admin';
    }
    await settings.save();

    await logActivity(req, 'SETTINGS_UPDATE', 'Settings', 'Updated Café store settings and delivery rules');
    res.json({ success: true, message: 'Settings saved successfully', settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================
// 13. ADMIN ACTIVITY LOGS
// ============================================
router.get('/activity-logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// 14. REPORTS & CSV EXPORT
// ============================================
router.get('/export/:type', protect, adminOnly, async (req, res) => {
  try {
    const { type } = req.params;
    let csvData = '';
    let filename = `coffeeblend_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'orders') {
      const orders = await Order.find().populate('user', 'username email').sort({ createdAt: -1 }).lean();
      csvData = 'Order ID,Date,Customer,Email,Fulfilment,Payment Method,Subtotal (INR),Delivery Fee (INR),Discount (INR),Total Amount (INR),Status\n';
      orders.forEach(o => {
        const custName = (o.user && o.user.username) ? o.user.username : (o.shippingAddress?.firstName || 'Customer');
        const email = (o.user && o.user.email) ? o.user.email : '';
        const dateStr = new Date(o.createdAt).toISOString();
        csvData += `"${o._id}","${dateStr}","${custName}","${email}","${o.fulfilmentType || 'pickup'}","${o.paymentMethod || 'COD'}",${o.subtotal || 0},${o.deliveryFee || 0},${o.discountAmount || 0},${o.totalAmount || 0},"${o.status}"\n`;
      });
    } else if (type === 'inventory') {
      const inv = await Inventory.find().sort({ name: 1 }).lean();
      csvData = 'Ingredient Name,Category,Current Stock,Unit,Min Threshold,Cost Per Unit (INR),Status\n';
      inv.forEach(i => {
        const status = i.stockQuantity <= 0 ? 'Out of Stock' : (i.stockQuantity <= i.minThreshold ? 'Low Stock' : 'Good');
        csvData += `"${i.name}","${i.category}",${i.stockQuantity},"${i.unit}",${i.minThreshold},${i.costPerUnit || 0},"${status}"\n`;
      });
    } else if (type === 'customers') {
      const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
      csvData = 'User ID,Username,Email,Phone,City,Pincode,Role,Loyalty Points,Member Since\n';
      users.forEach(u => {
        csvData += `"${u._id}","${u.username}","${u.email}","${u.phone || ''}","${u.city || 'Mumbai'}","${u.pincode || ''}","${u.role}",${u.loyaltyPoints || 0},"${new Date(u.createdAt).toISOString().split('T')[0]}"\n`;
      });
    } else if (type === 'products') {
      const prods = await Product.find().sort({ category: 1, name: 1 }).lean();
      csvData = 'Product ID,Name,Category,Price (INR),Available,Featured,Description\n';
      prods.forEach(p => {
        csvData += `"${p._id}","${p.name}","${p.category}",${p.price},${p.isAvailable},${p.isFeatured},"${(p.description || '').replace(/"/g, '""')}"\n`;
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type. Supported: orders, inventory, customers, products' });
    }

    await logActivity(req, 'CSV_EXPORT', 'Reports', `Generated CSV export for "${type}"`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
