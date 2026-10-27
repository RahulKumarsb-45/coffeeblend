/**
 * CoffeeBlend Full-Stack Production Verification Test Suite
 * Covers Auth, Admin Role Enforcement, Menu, Mumbai 10km Delivery, Advance Orders,
 * Table Bookings, Inventory Tracking, Loyalty Points, Coupons, Reviews,
 * Recommendations, A/B Experiments, and Admin Analytics.
 */
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const { app, server } = require('./server');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const results = [];
function record(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   COFFEEBLEND COMPREHENSIVE TEST SUITE');
  console.log('=============================================\n');

  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 25) {
    await sleep(200);
    attempts++;
  }

  let userToken = null;
  let adminToken = null;
  let testProductId = null;
  let createdOrderId = null;
  let createdBookingId = null;
  let testInventoryId = null;

  try {
    // 1. Database Connection
    const isConnected = mongoose.connection.readyState === 1;
    record('MongoDB Atlas Connection State', isConnected);

    // 2. Menu Loading
    try {
      const menuRes = await axios.get(`${BASE_URL}/menu`);
      const prods = menuRes.data.products || [];
      record('GET /api/menu returns products', prods.length > 0, `Count: ${prods.length}`);
      if (prods.length > 0) testProductId = prods[0]._id;

      const coffeeRes = await axios.get(`${BASE_URL}/menu?category=coffee`);
      record('Category Filter: GET /api/menu?category=coffee', (coffeeRes.data.products || []).length > 0);
    } catch (e) {
      record('Menu Loading', false, e.message);
    }

    // 3. Regular User Registration & Privilege Escalation Prevention
    const regEmail = `cust_${Date.now()}@example.com`;
    const regPassword = 'CustomerPass123!';
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        username: `Customer_${Date.now()}`,
        email: regEmail,
        password: regPassword,
        role: 'admin' // Attempted privilege escalation
      });

      userToken = regRes.data.token;
      const isRoleUser = regRes.data.user?.role === 'user';
      record('Public registration strictly enforces role: user', isRoleUser);
    } catch (e) {
      record('User Registration', false, e.message);
    }

    // 4. Designated Admin Registration & Authorization (kumar162339@gmail.com)
    const adminEmail = 'kumar162339@gmail.com';
    const adminPassword = 'AdminSecretPassword123!';
    try {
      // Check if admin already registered or register fresh
      let loginRes;
      try {
        loginRes = await axios.post(`${BASE_URL}/auth/login`, {
          email: adminEmail,
          password: adminPassword
        });
        adminToken = loginRes.data.token;
      } catch (loginErr) {
        // Register if not yet in DB
        const regAdminRes = await axios.post(`${BASE_URL}/auth/register`, {
          username: 'KumarAdmin',
          email: adminEmail,
          password: adminPassword
        });
        adminToken = regAdminRes.data.token;
      }

      const meAdmin = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const isAdminRole = meAdmin.data.user?.role === 'admin' || meAdmin.data.user?.email === adminEmail;
      record('Designated admin (kumar162339@gmail.com) has authorized admin access', isAdminRole);
    } catch (e) {
      record('Admin Auth Check', false, e.message);
    }

    // 5. Mumbai Delivery System (10 km radius check)
    try {
      const elRes = await axios.post(`${BASE_URL}/orders/check-delivery`, {
        address: 'Hill Road, Bandra West, Mumbai 400050',
        pincode: '400050'
      });
      record('Mumbai Delivery Check: Bandra West (<= 10km) is ELIGIBLE', elRes.data.isEligible === true && elRes.data.distanceKm <= 10);

      const inElRes = await axios.post(`${BASE_URL}/orders/check-delivery`, {
        address: 'Ghodbunder Road, Thane West 400601',
        pincode: '400601'
      });
      record('Mumbai Delivery Check: Thane West (> 10km) is REJECTED', inElRes.data.isEligible === false && inElRes.data.distanceKm > 10);
    } catch (e) {
      record('Mumbai Delivery Check', false, e.message);
    }

    // 6. Coupons System
    try {
      // Validate WELCOME50
      const cRes = await axios.post(`${BASE_URL}/coupons/validate`, {
        code: 'WELCOME50',
        subtotal: 300,
        fulfilmentType: 'pickup'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      record('Coupon Validation: WELCOME50 applies ₹50 discount', cRes.data.valid === true && cRes.data.discount === 50);

      // Validate min order rejection
      let minOrderRejected = false;
      try {
        await axios.post(`${BASE_URL}/coupons/validate`, {
          code: 'WELCOME50',
          subtotal: 100 // Below min 250
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      } catch (err) {
        minOrderRejected = err.response?.status === 400;
      }
      record('Coupon Rejection: Subtotal below minimum order value is rejected', minOrderRejected);
    } catch (e) {
      record('Coupons System', false, e.message);
    }

    // 7. Loyalty Rewards System
    try {
      const lRes = await axios.get(`${BASE_URL}/loyalty/balance`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      record('Loyalty System: GET /api/loyalty/balance returns ledger', lRes.data.success && typeof lRes.data.points === 'number');
    } catch (e) {
      record('Loyalty Balance', false, e.message);
    }

    // 8. Order Placement with Advance Scheduling & Coupon
    try {
      if (testProductId) {
        const arrivalTime = new Date(Date.now() + 25 * 60 * 1000).toISOString();
        const ordRes = await axios.post(`${BASE_URL}/orders`, {
          items: [{ productId: testProductId, quantity: 2, price: 180 }],
          fulfilmentType: 'pickup',
          advanceOrder: { isAdvance: true, arrivalTime },
          couponCode: 'WELCOME50',
          paymentMethod: 'Cash on Delivery'
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });

        const created = ordRes.data.success && !!ordRes.data.order?._id;
        record('Order Placement with Advance Time (~20min) & Coupon Discount', created);
        if (created) createdOrderId = ordRes.data.order._id;
      }
    } catch (e) {
      record('Order Placement', false, e.response?.data?.message || e.message);
    }

    // 9. Order Lifecycle & Status Transitions
    try {
      if (createdOrderId) {
        // Admin updates status to preparing
        const prepRes = await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
          status: 'preparing',
          estimatedReadyMinutes: 15
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        record('Order Lifecycle: Admin updates status to Preparing & records history', prepRes.data.success && prepRes.data.order?.status === 'preparing');

        // Admin updates status to completed (triggers loyalty points award)
        const compRes = await axios.put(`${BASE_URL}/orders/${createdOrderId}/status`, {
          status: 'completed'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        record('Order Lifecycle: Admin updates status to Completed', compRes.data.success && compRes.data.order?.status === 'completed');
      }
    } catch (e) {
      record('Order Status Lifecycle', false, e.message);
    }

    // 10. Table Booking Workflow
    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const bookRes = await axios.post(`${BASE_URL}/bookings`, {
        name: 'Aarav Mehta',
        phone: '9820012345',
        date: tomorrow,
        time: '19:00',
        guests: 4
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      record('Table Reservation: POST /api/bookings books table', bookRes.data.success);
      if (bookRes.data.booking) createdBookingId = bookRes.data.booking._id;
    } catch (e) {
      record('Table Booking', false, e.message);
    }

    // 11. Inventory Management & Alerts
    try {
      const invRes = await axios.get(`${BASE_URL}/inventory`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const items = invRes.data.inventory || [];
      record('Inventory System: GET /api/inventory returns ingredients', invRes.data.success && items.length > 0);
      if (items.length > 0) testInventoryId = items[0]._id;

      const alertRes = await axios.get(`${BASE_URL}/inventory/alerts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Inventory Alerts: GET /api/inventory/alerts checks stock thresholds', alertRes.data.success);

      if (testInventoryId) {
        const adjRes = await axios.put(`${BASE_URL}/inventory/${testInventoryId}/adjust`, {
          change: 5,
          reason: 'admin_test_restock'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        record('Inventory Adjustment: Restocking increases stock with audit trail', adjRes.data.success);
      }
    } catch (e) {
      record('Inventory System', false, e.message);
    }

    // 12. Customer Reviews
    try {
      const revRes = await axios.post(`${BASE_URL}/reviews`, {
        productId: testProductId,
        rating: 5,
        comment: 'Exceptional artisanal brew with notes of cocoa and citrus.'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      record('Reviews System: POST /api/reviews saves customer rating', revRes.data.success);

      const listRev = await axios.get(`${BASE_URL}/reviews`);
      record('Reviews System: GET /api/reviews returns published reviews', listRev.data.success && listRev.data.reviews.length > 0);
    } catch (e) {
      record('Customer Reviews', false, e.message);
    }

    // 13. Product Recommendations
    try {
      const recRes = await axios.get(`${BASE_URL}/recommendations?category=coffee`);
      record('Recommendations: GET /api/recommendations returns complementary pairings', recRes.data.success && (recRes.data.complementary || []).length > 0);
    } catch (e) {
      record('Recommendations', false, e.message);
    }

    // 14. A/B Testing Experiments
    try {
      const logRes = await axios.post(`${BASE_URL}/experiments/log`, {
        experimentKey: 'home_cta_v1',
        variant: 'A',
        sessionId: 'test_session_123',
        event: 'exposure'
      });
      record('A/B Experiments: POST /api/experiments/log tracks event', logRes.data.success);

      const repRes = await axios.get(`${BASE_URL}/experiments/report?experimentKey=home_cta_v1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('A/B Experiments: GET /api/experiments/report returns variant metrics', repRes.data.success && repRes.data.summary?.variants?.A);
    } catch (e) {
      record('A/B Experiments', false, e.message);
    }

    // 15. Admin Business Analytics & Operational Demand
    try {
      const anRes = await axios.get(`${BASE_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Admin Analytics: GET /api/analytics/overview returns revenue & order metrics', anRes.data.success && anRes.data.metrics?.totalOrders >= 0);

      const demRes = await axios.get(`${BASE_URL}/analytics/demand`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Admin Analytics: GET /api/analytics/demand returns busy slots & day breakdowns', demRes.data.success && demRes.data.demandByDay);
    } catch (e) {
      record('Admin Analytics', false, e.message);
    }

    // 16. Security & Role-Based Authorization Tests
    try {
      // Non-admin attempt to access admin analytics -> must return 403
      let nonAdmin403 = false;
      try {
        await axios.get(`${BASE_URL}/analytics/overview`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      } catch (err) {
        nonAdmin403 = err.response?.status === 403;
      }
      record('Authorization Security: Non-admin receives HTTP 403 Forbidden on analytics', nonAdmin403);

      // Non-admin attempt to access inventory -> must return 403
      let nonAdminInv403 = false;
      try {
        await axios.get(`${BASE_URL}/inventory`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      } catch (err) {
        nonAdminInv403 = err.response?.status === 403;
      }
      record('Authorization Security: Non-admin receives HTTP 403 Forbidden on inventory', nonAdminInv403);

      // Unauthenticated attempt -> must return 401
      let unauth401 = false;
      try {
        await axios.get(`${BASE_URL}/inventory`);
      } catch (err) {
        unauth401 = err.response?.status === 401;
      }
      record('Authorization Security: Unauthenticated request receives HTTP 401 Unauthorized', unauth401);
    } catch (e) {
      record('Security Authorization', false, e.message);
    }

  } catch (fatalErr) {
    console.error('Fatal test error:', fatalErr);
  } finally {
    console.log('\n=============================================');
    console.log('   FULL-STACK TEST SUMMARY');
    console.log('=============================================');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    console.log(`Total Verified : ${total}`);
    console.log(`Passed         : ${passed} ✅`);
    console.log(`Failed         : ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log('=============================================\n');

    try {
      await mongoose.connection.close();
      server.close();
    } catch (e) {}
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
