/**
 * CoffeeBlend — Frontend API Client & Helper
 * Unified, robust client for CoffeeBlend Indian Coffee Shop (Mumbai).
 */

(function (window) {
  'use strict';

  var getBaseUrl = function () {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
      return window.location.origin + '/api';
    }
    return 'http://localhost:5000/api';
  };

  var API = {
    BASE_URL: getBaseUrl(),

    getToken: function () {
      return localStorage.getItem('cb_token') || '';
    },

    getUser: function () {
      try {
        return JSON.parse(localStorage.getItem('cb_user') || 'null');
      } catch (e) {
        return null;
      }
    },

    headers: function (withAuth) {
      var h = { 'Content-Type': 'application/json' };
      if (withAuth) {
        var token = API.getToken();
        if (token) h['Authorization'] = 'Bearer ' + token;
      }
      return h;
    },

    formatINR: function (amount) {
      var num = parseFloat(amount || 0);
      return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /* ═══════════════════════ AUTH ═══════════════════════ */
    auth: {
      register: function (data) {
        return fetch(API.BASE_URL + '/auth/register', {
          method: 'POST',
          headers: API.headers(),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res.success && res.token) {
            localStorage.setItem('cb_token', res.token);
            localStorage.setItem('cb_user', JSON.stringify(res.user));
            API.cart.syncWithBackend();
          }
          return res;
        });
      },

      login: function (data) {
        return fetch(API.BASE_URL + '/auth/login', {
          method: 'POST',
          headers: API.headers(),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res.success && res.token) {
            localStorage.setItem('cb_token', res.token);
            localStorage.setItem('cb_user', JSON.stringify(res.user));
            API.cart.syncWithBackend();
          }
          return res;
        });
      },

      logout: function () {
        localStorage.removeItem('cb_token');
        localStorage.removeItem('cb_user');
        localStorage.removeItem('cb_cart');
        localStorage.removeItem('cb_shipping');
        API.initNavbar();
        API.cart.updateCount();
        window.location.href = 'index.html';
      },

      me: function () {
        return fetch(API.BASE_URL + '/auth/me', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      updateProfile: function (data) {
        return fetch(API.BASE_URL + '/auth/profile', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res.success && res.user) {
            localStorage.setItem('cb_user', JSON.stringify(res.user));
            API.initNavbar();
          }
          return res;
        });
      },

      isLoggedIn: function () {
        return !!API.getToken();
      }
    },

    /* ═══════════════════════ MENU ═══════════════════════ */
    menu: {
      getAll: function (category, search) {
        var params = [];
        if (category && category !== 'all') params.push('category=' + encodeURIComponent(category));
        if (search) params.push('q=' + encodeURIComponent(search));
        var qs = params.length > 0 ? '?' + params.join('&') : '';
        return fetch(API.BASE_URL + '/menu' + qs).then(function (r) { return r.json(); });
      },

      getFeatured: function () {
        return fetch(API.BASE_URL + '/menu/featured').then(function (r) { return r.json(); });
      },

      getCategories: function () {
        return fetch(API.BASE_URL + '/menu/categories').then(function (r) { return r.json(); });
      },

      getById: function (id) {
        return fetch(API.BASE_URL + '/menu/' + id).then(function (r) { return r.json(); });
      },

      create: function (data) {
        return fetch(API.BASE_URL + '/menu', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      update: function (id, data) {
        return fetch(API.BASE_URL + '/menu/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      toggleAvailability: function (id, isAvailable) {
        return fetch(API.BASE_URL + '/menu/' + id + '/availability', {
          method: 'PATCH',
          headers: API.headers(true),
          body: JSON.stringify({ isAvailable: isAvailable })
        }).then(function (r) { return r.json(); });
      },

      remove: function (id) {
        return fetch(API.BASE_URL + '/menu/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ CART ═══════════════════════ */
    cart: {
      getLocal: function () {
        try {
          return JSON.parse(localStorage.getItem('cb_cart') || '[]');
        } catch (e) {
          return [];
        }
      },

      saveLocal: function (items) {
        localStorage.setItem('cb_cart', JSON.stringify(items));
        API.cart.updateCount();
      },

      getItemKey: function (item) {
        return (item.productId || '') + '_' + (item.size || 'Regular') + '_' + (item.milk || 'Standard') + '_' + (item.sugar || 'Normal');
      },

      add: function (item) {
        var items = API.cart.getLocal();
        var key = API.cart.getItemKey(item);
        var idx = items.findIndex(function (i) { return API.cart.getItemKey(i) === key; });
        var qtyToAdd = parseInt(item.quantity, 10) || 1;

        if (idx >= 0) {
          items[idx].quantity += qtyToAdd;
        } else {
          items.push({
            productId: item.productId || item._id,
            name: item.name,
            price: parseFloat(item.price),
            image: item.image || 'images/menu-1.jpg',
            quantity: qtyToAdd,
            size: item.size || 'Regular',
            milk: item.milk || 'Standard',
            sugar: item.sugar || 'Normal'
          });
        }
        API.cart.saveLocal(items);

        // Background sync if logged in
        if (API.auth.isLoggedIn()) {
          fetch(API.BASE_URL + '/cart/add', {
            method: 'POST',
            headers: API.headers(true),
            body: JSON.stringify({
              productId: item.productId || item._id,
              name: item.name,
              price: item.price,
              quantity: qtyToAdd,
              size: item.size || 'Regular',
              milk: item.milk || 'Standard',
              sugar: item.sugar || 'Normal'
            })
          }).catch(function () {});
        }

        return { success: true, items: items };
      },

      update: function (keyOrId, quantity) {
        var items = API.cart.getLocal();
        var idx = items.findIndex(function (i) {
          return API.cart.getItemKey(i) === keyOrId || i.productId === keyOrId || i._id === keyOrId;
        });
        if (idx >= 0) {
          if (quantity <= 0) {
            items.splice(idx, 1);
          } else {
            items[idx].quantity = quantity;
          }
          API.cart.saveLocal(items);
        }
      },

      remove: function (keyOrId) {
        var items = API.cart.getLocal().filter(function (i) {
          return API.cart.getItemKey(i) !== keyOrId && i.productId !== keyOrId && i._id !== keyOrId;
        });
        API.cart.saveLocal(items);
      },

      clear: function () {
        localStorage.removeItem('cb_cart');
        API.cart.updateCount();
        if (API.auth.isLoggedIn()) {
          fetch(API.BASE_URL + '/cart/clear', {
            method: 'DELETE',
            headers: API.headers(true)
          }).catch(function () {});
        }
      },

      getTotal: function () {
        return API.cart.getLocal().reduce(function (sum, i) {
          return sum + (parseFloat(i.price || 0) * (parseInt(i.quantity, 10) || 1));
        }, 0);
      },

      getCount: function () {
        return API.cart.getLocal().reduce(function (sum, i) {
          return sum + (parseInt(i.quantity, 10) || 1);
        }, 0);
      },

      updateCount: function () {
        var count = API.cart.getCount();
        var badges = document.querySelectorAll('.cb-cart-badge');
        badges.forEach(function (badge) {
          badge.textContent = count;
          badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
      },

      syncWithBackend: function () {
        if (!API.auth.isLoggedIn()) return;
        fetch(API.BASE_URL + '/cart', { headers: API.headers(true) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success && res.cart && res.cart.items && res.cart.items.length > 0) {
              var local = API.cart.getLocal();
              if (local.length === 0) {
                API.cart.saveLocal(res.cart.items);
              }
            }
          })
          .catch(function () {});
      }
    },

    /* ═══════════════════════ ORDERS ═══════════════════════ */
    orders: {
      checkDelivery: function (data) {
        return fetch(API.BASE_URL + '/orders/check-delivery', {
          method: 'POST',
          headers: API.headers(false),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      place: function (orderData) {
        return fetch(API.BASE_URL + '/orders', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(orderData)
        }).then(function (r) { return r.json(); });
      },

      myOrders: function () {
        return fetch(API.BASE_URL + '/orders/my-orders', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      getById: function (id) {
        return fetch(API.BASE_URL + '/orders/' + id, {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      cancel: function (id, reason) {
        return fetch(API.BASE_URL + '/orders/' + id + '/cancel', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify({ reason: reason || 'Customer requested cancellation' })
        }).then(function (r) { return r.json(); });
      },

      adminGetAll: function () {
        return fetch(API.BASE_URL + '/orders/admin/all', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      adminUpdateStatus: function (id, status, estimatedReadyMinutes, note) {
        return fetch(API.BASE_URL + '/orders/' + id + '/status', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify({ status: status, estimatedReadyMinutes: estimatedReadyMinutes, note: note })
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ BOOKINGS ═══════════════════════ */
    bookings: {
      book: function (data) {
        return fetch(API.BASE_URL + '/bookings', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      myBookings: function () {
        return fetch(API.BASE_URL + '/bookings/my-bookings', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      cancel: function (id, reason) {
        return fetch(API.BASE_URL + '/bookings/' + id + '/cancel', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify({ reason: reason || 'Customer requested cancellation' })
        }).then(function (r) { return r.json(); });
      },

      adminGetAll: function () {
        return fetch(API.BASE_URL + '/bookings/admin/all', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      adminUpdateStatus: function (id, status) {
        return fetch(API.BASE_URL + '/bookings/' + id + '/status', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify({ status: status })
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ PAYMENT ═══════════════════════ */
    payment: {
      getConfig: function () {
        return fetch(API.BASE_URL + '/payment/config').then(function (r) { return r.json(); });
      },

      createOrder: function (data) {
        return fetch(API.BASE_URL + '/payment/create-order', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      captureOrder: function (paypalOrderId, data) {
        return fetch(API.BASE_URL + '/payment/capture/' + encodeURIComponent(paypalOrderId), {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data || {})
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ COUPONS ═══════════════════════ */
    coupons: {
      validate: function (code, subtotal, fulfilmentType) {
        return fetch(API.BASE_URL + '/coupons/validate', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify({ code: code, subtotal: subtotal, fulfilmentType: fulfilmentType })
        }).then(function (r) { return r.json(); });
      },

      getActive: function () {
        return fetch(API.BASE_URL + '/coupons/active').then(function (r) { return r.json(); });
      },

      getAll: function () {
        return fetch(API.BASE_URL + '/coupons/all', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      create: function (data) {
        return fetch(API.BASE_URL + '/coupons', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      remove: function (id) {
        return fetch(API.BASE_URL + '/coupons/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ LOYALTY ═══════════════════════ */
    loyalty: {
      getBalance: function () {
        return fetch(API.BASE_URL + '/loyalty/balance', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      redeem: function (points, subtotal) {
        return fetch(API.BASE_URL + '/loyalty/redeem', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify({ points: points, subtotal: subtotal })
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ REVIEWS ═══════════════════════ */
    reviews: {
      list: function (productId) {
        var url = API.BASE_URL + '/reviews' + (productId ? '?productId=' + encodeURIComponent(productId) : '');
        return fetch(url).then(function (r) { return r.json(); });
      },

      submit: function (data) {
        return fetch(API.BASE_URL + '/reviews', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },

      remove: function (id) {
        return fetch(API.BASE_URL + '/reviews/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ RECOMMENDATIONS ═══════════════════════ */
    recommendations: {
      get: function (category, productId) {
        var query = [];
        if (category) query.push('category=' + encodeURIComponent(category));
        if (productId) query.push('productId=' + encodeURIComponent(productId));
        var url = API.BASE_URL + '/recommendations' + (query.length > 0 ? '?' + query.join('&') : '');
        return fetch(url).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ INVENTORY (Admin) ═══════════════════════ */
    inventory: {
      list: function (category) {
        var url = API.BASE_URL + '/inventory' + (category ? '?category=' + encodeURIComponent(category) : '');
        return fetch(url, { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },

      getAlerts: function () {
        return fetch(API.BASE_URL + '/inventory/alerts', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      adjust: function (id, change, reason) {
        return fetch(API.BASE_URL + '/inventory/' + id + '/adjust', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify({ change: change, reason: reason })
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ ANALYTICS (Admin) ═══════════════════════ */
    analytics: {
      getOverview: function () {
        return fetch(API.BASE_URL + '/analytics/overview', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      getProducts: function () {
        return fetch(API.BASE_URL + '/analytics/products', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },

      getDemand: function () {
        return fetch(API.BASE_URL + '/analytics/demand', {
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ EXPERIMENTS (A/B) ═══════════════════════ */
    experiments: {
      log: function (data) {
        return fetch(API.BASE_URL + '/experiments/log', {
          method: 'POST',
          headers: API.headers(false),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); }).catch(function () {});
      },

      getReport: function (experimentKey) {
        var url = API.BASE_URL + '/experiments/report' + (experimentKey ? '?experimentKey=' + encodeURIComponent(experimentKey) : '');
        return fetch(url, { headers: API.headers(true) }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ MANAGEMENT (Admin Portal) ═══════════════════════ */
    management: {
      getOverview: function () {
        return fetch(API.BASE_URL + '/management/overview', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      getAnalytics: function (timeRange, startDate, endDate) {
        var params = [];
        if (timeRange) params.push('timeRange=' + encodeURIComponent(timeRange));
        if (startDate) params.push('startDate=' + encodeURIComponent(startDate));
        if (endDate) params.push('endDate=' + encodeURIComponent(endDate));
        var qs = params.length > 0 ? '?' + params.join('&') : '';
        return fetch(API.BASE_URL + '/management/analytics' + qs, { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      getCustomers: function (search, page, limit) {
        var params = [];
        if (search) params.push('search=' + encodeURIComponent(search));
        if (page) params.push('page=' + page);
        if (limit) params.push('limit=' + limit);
        var qs = params.length > 0 ? '?' + params.join('&') : '';
        return fetch(API.BASE_URL + '/management/customers' + qs, { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      getLoyalty: function () {
        return fetch(API.BASE_URL + '/management/loyalty', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      adjustLoyalty: function (userId, pointsChange, reason) {
        return fetch(API.BASE_URL + '/management/loyalty/adjust', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify({ userId: userId, pointsChange: pointsChange, reason: reason })
        }).then(function (r) { return r.json(); });
      },
      getCampaigns: function () {
        return fetch(API.BASE_URL + '/management/campaigns', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createCampaign: function (data) {
        return fetch(API.BASE_URL + '/management/campaigns', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      sendCampaign: function (id) {
        return fetch(API.BASE_URL + '/management/campaigns/' + id + '/send', {
          method: 'POST',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getRoadmap: function () {
        return fetch(API.BASE_URL + '/management/roadmap', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createRoadmap: function (data) {
        return fetch(API.BASE_URL + '/management/roadmap', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      updateRoadmap: function (id, data) {
        return fetch(API.BASE_URL + '/management/roadmap/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      deleteRoadmap: function (id) {
        return fetch(API.BASE_URL + '/management/roadmap/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getProblems: function () {
        return fetch(API.BASE_URL + '/management/problems', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createProblem: function (data) {
        return fetch(API.BASE_URL + '/management/problems', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      updateProblem: function (id, data) {
        return fetch(API.BASE_URL + '/management/problems/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      deleteProblem: function (id) {
        return fetch(API.BASE_URL + '/management/problems/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getPrioritization: function () {
        return fetch(API.BASE_URL + '/management/prioritization', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createPrioritization: function (data) {
        return fetch(API.BASE_URL + '/management/prioritization', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      updatePrioritization: function (id, data) {
        return fetch(API.BASE_URL + '/management/prioritization/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      deletePrioritization: function (id) {
        return fetch(API.BASE_URL + '/management/prioritization/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getGoals: function () {
        return fetch(API.BASE_URL + '/management/goals', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createGoal: function (data) {
        return fetch(API.BASE_URL + '/management/goals', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      updateGoal: function (id, data) {
        return fetch(API.BASE_URL + '/management/goals/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      deleteGoal: function (id) {
        return fetch(API.BASE_URL + '/management/goals/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getDecisions: function () {
        return fetch(API.BASE_URL + '/management/decisions', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      createDecision: function (data) {
        return fetch(API.BASE_URL + '/management/decisions', {
          method: 'POST',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      updateDecision: function (id, data) {
        return fetch(API.BASE_URL + '/management/decisions/' + id, {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      deleteDecision: function (id) {
        return fetch(API.BASE_URL + '/management/decisions/' + id, {
          method: 'DELETE',
          headers: API.headers(true)
        }).then(function (r) { return r.json(); });
      },
      getFunnel: function () {
        return fetch(API.BASE_URL + '/management/funnel', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      trackFunnel: function (eventType, productId, productName, amount) {
        var sid = localStorage.getItem('cb_session_id');
        if (!sid) {
          sid = 'sess_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('cb_session_id', sid);
        }
        return fetch(API.BASE_URL + '/management/funnel/track', {
          method: 'POST',
          headers: API.headers(false),
          body: JSON.stringify({ eventType: eventType, sessionId: sid, productId: productId, productName: productName, amount: amount })
        }).then(function (r) { return r.json(); }).catch(function () {});
      },
      getSettings: function () {
        return fetch(API.BASE_URL + '/management/settings', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      updateSettings: function (data) {
        return fetch(API.BASE_URL + '/management/settings', {
          method: 'PUT',
          headers: API.headers(true),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      },
      getActivityLogs: function () {
        return fetch(API.BASE_URL + '/management/activity-logs', { headers: API.headers(true) }).then(function (r) { return r.json(); });
      },
      getExportUrl: function (type) {
        return API.BASE_URL + '/management/export/' + encodeURIComponent(type);
      }
    },

    /* ═══════════════════════ CONTACT ═══════════════════════ */
    contact: {
      send: function (data) {
        return fetch(API.BASE_URL + '/contact', {
          method: 'POST',
          headers: API.headers(false),
          body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
      }
    },

    /* ═══════════════════════ UI HELPERS ═══════════════════════ */
    showAlert: function (message, type) {
      var existing = document.querySelector('.cb-alert');
      if (existing) existing.remove();

      var el = document.createElement('div');
      el.className = 'cb-alert';
      var isError = type === 'error';
      el.style.cssText = [
        'position:fixed',
        'top:85px',
        'right:20px',
        'z-index:999999',
        'padding:14px 24px',
        'border-radius:10px',
        'font-weight:500',
        'box-shadow:0 8px 30px rgba(0,0,0,0.35)',
        'min-width:280px',
        'max-width:420px',
        'background:' + (isError ? '#dc3545' : '#28a745'),
        'color:#fff',
        'font-family:Poppins,sans-serif',
        'font-size:14px',
        'transition:all 0.3s ease',
        'display:flex',
        'align-items:center',
        'gap:10px'
      ].join(';');

      el.innerHTML = '<span>' + (isError ? '❌ ' : '✅ ') + '</span><span>' + message + '</span>';
      document.body.appendChild(el);

      setTimeout(function () {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 320);
      }, 4000);
    },

    initCartBadge: function () {
      var cartLinks = document.querySelectorAll('.nav-item.cart a, .navbar-nav a[href*="cart.html"]');
      cartLinks.forEach(function (cartLink) {
        if (!cartLink.querySelector('.cb-cart-badge')) {
          cartLink.style.position = 'relative';
          var badge = document.createElement('span');
          badge.className = 'cb-cart-badge';
          badge.style.cssText = [
            'background:#c49b63',
            'color:#fff',
            'border-radius:50%',
            'font-size:10px',
            'font-weight:700',
            'padding:2px 6px',
            'position:absolute',
            'top:4px',
            'right:-6px',
            'display:none',
            'line-height:1.3'
          ].join(';');
          cartLink.appendChild(badge);
        }
      });
      API.cart.updateCount();
    },

    initNavbar: function () {
      var isLoggedIn = API.auth.isLoggedIn();
      var user = API.getUser();

      var loginItems = document.querySelectorAll('#nav-login-item, .nav-login-item');
      var registerItems = document.querySelectorAll('#nav-register-item, .nav-register-item');
      var userDropdowns = document.querySelectorAll('#nav-user-dropdown, .nav-user-dropdown');
      var usernameDisplays = document.querySelectorAll('#cb-username-display, .cb-username-display');

      if (isLoggedIn && user) {
        var displayName = user.username || user.name || (user.email ? user.email.split('@')[0] : 'Member');
        usernameDisplays.forEach(function (el) {
          el.textContent = displayName;
        });

        loginItems.forEach(function (el) { el.style.display = 'none'; });
        registerItems.forEach(function (el) { el.style.display = 'none'; });
        userDropdowns.forEach(function (el) { el.style.display = ''; });
      } else {
        loginItems.forEach(function (el) { el.style.display = ''; });
        registerItems.forEach(function (el) { el.style.display = ''; });
        userDropdowns.forEach(function (el) { el.style.display = 'none'; });
      }

      // Bind dropdown toggle click handlers for smooth operation across Bootstrap versions
      var toggles = document.querySelectorAll('.cb-user-toggle, #cb-user-menu');
      toggles.forEach(function (toggle) {
        if (!toggle.getAttribute('data-cb-bound')) {
          toggle.setAttribute('data-cb-bound', 'true');
          toggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var menu = toggle.nextElementSibling || toggle.parentElement.querySelector('.dropdown-menu');
            if (menu) {
              var isOpen = menu.classList.contains('show');
              document.querySelectorAll('.cb-user-dropdown-menu.show').forEach(function (m) {
                m.classList.remove('show');
              });
              if (!isOpen) {
                menu.classList.add('show');
                toggle.setAttribute('aria-expanded', 'true');
              } else {
                toggle.setAttribute('aria-expanded', 'false');
              }
            }
          });
        }
      });

      // Bind logout buttons
      var logoutBtns = document.querySelectorAll('.cb-logout-btn');
      logoutBtns.forEach(function (btn) {
        if (!btn.getAttribute('data-cb-bound')) {
          btn.setAttribute('data-cb-bound', 'true');
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            API.auth.logout();
          });
        }
      });
    }
  };

  // Close dropdown on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#nav-user-dropdown') && !e.target.closest('.cb-user-dropdown-menu')) {
      document.querySelectorAll('.cb-user-dropdown-menu.show').forEach(function (m) {
        m.classList.remove('show');
      });
    }
  });

  // Auto initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    API.initCartBadge();
    API.initNavbar();
  });

  API.products = API.menu;
  window.API = API;
})(window);
