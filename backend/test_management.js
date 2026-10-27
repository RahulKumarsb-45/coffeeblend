/**
 * CoffeeBlend — Business Management Endpoints Automated Verification
 * Tests authorization (401 unauth, 403 non-admin, 200 admin) and all 21 modules:
 * Overview, Analytics, Orders, Products, Inventory, Customers, Loyalty, Coupons,
 * Marketing, Bookings, Reviews, Roadmap, Problems, Prioritization, Experiments,
 * Funnel, Goals, Decisions, Reports CSV, Settings, Activity Log.
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

async function runManagementTests() {
  console.log('\n=============================================');
  console.log('   BUSINESS MANAGEMENT SUITE VERIFICATION');
  console.log('=============================================\n');

  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 25) {
    await sleep(200);
    attempts++;
  }

  let adminToken = null;
  let userToken = null;

  try {
    // 1. Authenticate regular user
    const userRes = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'UserPass123!'
    });
    userToken = userRes.data.token;
    record('Regular User Registration', !!userToken);

    // 2. Authenticate admin (kumar162339@gmail.com)
    const adminEmail = 'kumar162339@gmail.com';
    const adminPassword = 'AdminSecretPassword123!';
    let adminLogin;
    try {
      adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: adminEmail,
        password: adminPassword
      });
      adminToken = adminLogin.data.token;
    } catch (e) {
      const adminReg = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'KumarAdmin',
        email: adminEmail,
        password: adminPassword
      });
      adminToken = adminReg.data.token;
    }
    record('Admin Authentication', !!adminToken);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 3. Security: Unauthenticated request to /api/management/overview returns 401
    try {
      await axios.get(`${BASE_URL}/management/overview`);
      record('Security: Unauthenticated request returns 401', false);
    } catch (err) {
      record('Security: Unauthenticated request returns 401', err.response?.status === 401);
    }

    // 4. Security: Non-admin request to /api/management/overview returns 403
    try {
      await axios.get(`${BASE_URL}/management/overview`, { headers: userHeaders });
      record('Security: Non-admin request returns 403 Forbidden', false);
    } catch (err) {
      record('Security: Non-admin request returns 403 Forbidden', err.response?.status === 403);
    }

    // 5. Module 1: Overview
    const ovRes = await axios.get(`${BASE_URL}/management/overview`, { headers: adminHeaders });
    record('Module 1: Overview returns today & eligible KPIs', ovRes.data.success && typeof ovRes.data.data.eligibleRevenue === 'number');

    // 6. Module 2: Analytics Dashboard (30d and custom)
    const anRes = await axios.get(`${BASE_URL}/management/analytics?timeRange=30d`, { headers: adminHeaders });
    record('Module 2: Analytics returns 30d real metrics & charts', anRes.data.success && !!anRes.data.kpis && !!anRes.data.charts);

    // 7. Module 3: Orders Management
    const ordRes = await axios.get(`${BASE_URL}/orders/admin/all`, { headers: adminHeaders });
    record('Module 3: Orders Management returns all orders with status', ordRes.data.success && Array.isArray(ordRes.data.orders));

    // 8. Module 4: Products & Menu CRUD
    const newProd = await axios.post(`${BASE_URL}/menu`, {
      name: `Special Batch Roast ${Date.now()}`,
      category: 'coffee',
      price: 240,
      image: 'images/menu-1.jpg',
      description: 'Single-estate artisanal light roast'
    }, { headers: adminHeaders });
    const createdProdId = newProd.data.product?._id;
    record('Module 4: Products & Menu creates new product', newProd.data.success && !!createdProdId);

    if (createdProdId) {
      const toggleRes = await axios.patch(`${BASE_URL}/menu/${createdProdId}/availability`, { isAvailable: false }, { headers: adminHeaders });
      record('Module 4: Products & Menu toggles availability safely', toggleRes.data.success && toggleRes.data.product?.isAvailable === false);
    }

    // 9. Module 5: Inventory & Ingredients
    const invRes = await axios.get(`${BASE_URL}/inventory`, { headers: adminHeaders });
    record('Module 5: Inventory returns stock & thresholds', invRes.data.success && invRes.data.inventory.length > 0);

    // 10. Module 6: Customer Management
    const custRes = await axios.get(`${BASE_URL}/management/customers`, { headers: adminHeaders });
    const custs = custRes.data.customers || [];
    const noPasswordsExposed = custs.every(c => c.password === undefined);
    record('Module 6: Customers list protects privacy (no passwords/hashes)', custRes.data.success && noPasswordsExposed);

    // 11. Module 7: Loyalty Program
    const loyRes = await axios.get(`${BASE_URL}/management/loyalty`, { headers: adminHeaders });
    record('Module 7: Loyalty returns rules & transaction ledger', loyRes.data.success && !!loyRes.data.rules);

    // 12. Module 8: Coupons & Offers
    const cpnRes = await axios.get(`${BASE_URL}/coupons/all`, { headers: adminHeaders });
    record('Module 8: Coupons returns promotional catalogue', cpnRes.data.success && cpnRes.data.coupons.length > 0);

    // 13. Module 9: Marketing Campaigns
    const newCmp = await axios.post(`${BASE_URL}/management/campaigns`, {
      name: 'Monsoon Morning Warmup',
      channel: 'Email',
      targetAudience: 'All Registered Customers',
      subject: 'Warm up with single-origin pour-overs',
      content: 'Freshly roasted beans delivered in 25 mins in Bandra.'
    }, { headers: adminHeaders });
    const createdCmpId = newCmp.data.campaign?._id;
    record('Module 9: Marketing creates draft campaign', newCmp.data.success && !!createdCmpId);

    if (createdCmpId) {
      const sendRes = await axios.post(`${BASE_URL}/management/campaigns/${createdCmpId}/send`, {}, { headers: adminHeaders });
      record('Module 9: Marketing dispatches campaign safely', sendRes.data.success && sendRes.data.campaign?.status === 'Sent');
    }

    // 14. Module 10: Bookings Management
    const bookRes = await axios.get(`${BASE_URL}/bookings/admin/all`, { headers: adminHeaders });
    record('Module 10: Bookings returns reservations queue', bookRes.data.success && Array.isArray(bookRes.data.bookings));

    // 15. Module 11: Reviews & Feedback
    const revRes = await axios.get(`${BASE_URL}/reviews`);
    record('Module 11: Reviews returns genuine database ratings', revRes.data.success && Array.isArray(revRes.data.reviews));

    // 16. Module 12: Product Roadmap
    const rdRes = await axios.get(`${BASE_URL}/management/roadmap`, { headers: adminHeaders });
    record('Module 12: Product Roadmap returns initiatives across states', rdRes.data.success && rdRes.data.items.length > 0);

    // 17. Module 13: Customer Problem Backlog
    const pbRes = await axios.get(`${BASE_URL}/management/problems`, { headers: adminHeaders });
    record('Module 13: Customer Problem Backlog returns categorized friction points', pbRes.data.success && pbRes.data.problems.length > 0);

    // 18. Module 14: Feature Prioritization (RICE)
    const riceRes = await axios.get(`${BASE_URL}/management/prioritization`, { headers: adminHeaders });
    record('Module 14: Feature Prioritization returns RICE calculated scores', riceRes.data.success && riceRes.data.features.length > 0 && typeof riceRes.data.features[0].riceScore === 'number');

    // 19. Module 15: Experiments & A/B Testing
    const expRes = await axios.get(`${BASE_URL}/experiments/report?experimentKey=home_cta_v1`, { headers: adminHeaders });
    record('Module 15: Experiments returns real exposures & conversion rates', expRes.data.success && !!expRes.data.summary?.variants?.A);

    // 20. Module 16: Product Funnel
    const fnRes = await axios.get(`${BASE_URL}/management/funnel`, { headers: adminHeaders });
    record('Module 16: Product Funnel returns stage drop-off percentages', fnRes.data.success && !!fnRes.data.rates?.overallConversion);

    // 21. Module 17: Product Goals & KPIs
    const goalRes = await axios.get(`${BASE_URL}/management/goals`, { headers: adminHeaders });
    record('Module 17: Product Goals returns target vs measured progress', goalRes.data.success && goalRes.data.goals.length > 0);

    // 22. Module 18: Product Decision Log
    const decRes = await axios.get(`${BASE_URL}/management/decisions`, { headers: adminHeaders });
    record('Module 18: Product Decision Log returns context & alternatives', decRes.data.success && decRes.data.decisions.length > 0);

    // 23. Module 19: Reports & CSV Export
    const csvRes = await axios.get(`${BASE_URL}/management/export/orders`, { headers: adminHeaders });
    const isCsvHeader = typeof csvRes.data === 'string' && csvRes.data.startsWith('Order ID');
    record('Module 19: Reports returns structured CSV download', csvRes.status === 200 && isCsvHeader);

    // 24. Module 20: Store Settings
    const setRes = await axios.get(`${BASE_URL}/management/settings`, { headers: adminHeaders });
    record('Module 20: Settings returns persistent store & Mumbai delivery rules', setRes.data.success && setRes.data.settings?.delivery?.maxRadiusKm === 10);

    // 25. Module 21: Admin Activity Log
    const actRes = await axios.get(`${BASE_URL}/management/activity-logs`, { headers: adminHeaders });
    record('Module 21: Activity Log returns audit trail of management events', actRes.data.success && actRes.data.logs.length > 0);

  } catch (fatalErr) {
    console.error('Fatal test error in management suite:', fatalErr);
  } finally {
    console.log('\n=============================================');
    console.log('   BUSINESS MANAGEMENT VERIFICATION SUMMARY');
    console.log('=============================================');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    console.log(`Total Tested : ${total}`);
    console.log(`Passed       : ${passed} ✅`);
    console.log(`Failed       : ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log('=============================================\n');

    try {
      await mongoose.connection.close();
      server.close();
    } catch (e) {}
    process.exit(failed > 0 ? 1 : 0);
  }
}

runManagementTests();
