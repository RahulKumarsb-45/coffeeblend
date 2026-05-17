/**
 * CoffeeBlend — Frontend API Helper (FIXED)
 * Single source of truth for all API calls + cart logic.
 * No duplicate listeners. No broken selectors.
 */

var API = {
  BASE_URL: 'http://localhost:5000/api',

  getToken: function() { return localStorage.getItem('cb_token'); },
  getUser:  function() { return JSON.parse(localStorage.getItem('cb_user') || 'null'); },

  headers: function(withAuth) {
    var h = { 'Content-Type': 'application/json' };
    if (withAuth) h['Authorization'] = 'Bearer ' + API.getToken();
    return h;
  },

  /* ═══════════════════════ AUTH ═══════════════════════ */
  auth: {
    register: function(data) {
      return fetch(API.BASE_URL + '/auth/register', {
        method: 'POST', headers: API.headers(), body: JSON.stringify(data)
      }).then(function(r){ return r.json(); });
    },
    login: function(data) {
      return fetch(API.BASE_URL + '/auth/login', {
        method: 'POST', headers: API.headers(), body: JSON.stringify(data)
      }).then(function(r){ return r.json(); }).then(function(result){
        if (result.success) {
          localStorage.setItem('cb_token', result.token);
          localStorage.setItem('cb_user',  JSON.stringify(result.user));
        }
        return result;
      });
    },
    logout: function() {
      localStorage.removeItem('cb_token');
      localStorage.removeItem('cb_user');
      localStorage.removeItem('cb_cart');
      window.location.href = 'index.html';
    },
    isLoggedIn: function() { return !!localStorage.getItem('cb_token'); }
  },

  /* ═══════════════════════ CART (localStorage) ═══════════════════════ */
  cart: {
    getLocal: function() {
      try { return JSON.parse(localStorage.getItem('cb_cart') || '[]'); }
      catch(e) { return []; }
    },
    saveLocal: function(items) {
      localStorage.setItem('cb_cart', JSON.stringify(items));
    },
    add: function(item) {
      var items = API.cart.getLocal();
      var idx   = items.findIndex(function(i){ return i.productId === item.productId; });
      if (idx >= 0) {
        items[idx].quantity += (item.quantity || 1);
      } else {
        items.push({
          productId: item.productId,
          name:      item.name,
          price:     parseFloat(item.price),
          image:     item.image || 'images/menu-1.jpg',
          quantity:  item.quantity || 1
        });
      }
      API.cart.saveLocal(items);
      API.cart.updateCount();
      return { success: true, items: items };
    },
    remove: function(productId) {
      var items = API.cart.getLocal().filter(function(i){ return i.productId !== productId; });
      API.cart.saveLocal(items);
      API.cart.updateCount();
    },
    update: function(productId, quantity) {
      var items = API.cart.getLocal();
      var idx   = items.findIndex(function(i){ return i.productId === productId; });
      if (idx >= 0) {
        if (quantity <= 0) items.splice(idx, 1);
        else items[idx].quantity = quantity;
      }
      API.cart.saveLocal(items);
      API.cart.updateCount();
    },
    clear: function() {
      localStorage.removeItem('cb_cart');
      API.cart.updateCount();
    },
    getTotal: function() {
      return API.cart.getLocal().reduce(function(sum, i){ return sum + (i.price * i.quantity); }, 0);
    },
    getCount: function() {
      return API.cart.getLocal().reduce(function(sum, i){ return sum + i.quantity; }, 0);
    },
    updateCount: function() {
      var count = API.cart.getCount();
      var badge = document.querySelector('.cb-cart-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    }
  },

  /* ═══════════════════════ ORDERS ═══════════════════════ */
  orders: {
    place: function(orderData) {
      return fetch(API.BASE_URL + '/orders', {
        method: 'POST',
        headers: API.headers(true),
        body: JSON.stringify(orderData)
      }).then(function(r){ return r.json(); });
    },
    myOrders: function() {
      return fetch(API.BASE_URL + '/orders/my-orders', {
        headers: API.headers(true)
      }).then(function(r){ return r.json(); });
    }
  },

  /* ═══════════════════════ BOOKINGS ═══════════════════════ */
  bookings: {
   book: function(data) {
  return fetch(API.BASE_URL + '/bookings', {
    method: 'POST',
    headers: API.headers(true),
    body: JSON.stringify(data)
  }).then(function(r){ return r.json(); });
   }
  },

  /* ═══════════════════════ CONTACT ═══════════════════════ */
  contact: {
    send: function(data) {
      return fetch(API.BASE_URL + '/contact', {
        method: 'POST', headers: API.headers(), body: JSON.stringify(data)
      }).then(function(r){ return r.json(); });
    }
  },

  /* ═══════════════════════ UI HELPERS ═══════════════════════ */
  showAlert: function(message, type) {
    var existing = document.querySelector('.cb-alert');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'cb-alert';
    el.style.cssText = [
      'position:fixed',
      'top:85px',
      'right:20px',
      'z-index:99999',
      'padding:13px 22px',
      'border-radius:8px',
      'font-weight:500',
      'box-shadow:0 4px 20px rgba(0,0,0,.22)',
      'min-width:270px',
      'background:' + (type === 'error' ? '#dc3545' : '#28a745'),
      'color:#fff',
      'font-family:Poppins,sans-serif',
      'font-size:14px'
    ].join(';');
    el.textContent = (type === 'error' ? '❌ ' : '✅ ') + message;
    document.body.appendChild(el);
    setTimeout(function(){
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(function(){ if (el.parentNode) el.remove(); }, 320);
    }, 3500);
  },

  /* Inject cart badge into navbar cart icon — call once on DOMContentLoaded */
  initCartBadge: function() {
    var cartLink = document.querySelector('.nav-item.cart a');
    if (cartLink && !document.querySelector('.cb-cart-badge')) {
      cartLink.style.position = 'relative';
      var badge = document.createElement('span');
      badge.className = 'cb-cart-badge';
      badge.style.cssText = [
        'background:#f96d00',
        'color:#fff',
        'border-radius:50%',
        'font-size:10px',
        'font-weight:700',
        'padding:2px 6px',
        'position:absolute',
        'top:2px',
        'right:-6px',
        'display:none',
        'line-height:1.4'
      ].join(';');
      cartLink.appendChild(badge);
      API.cart.updateCount();
    }
  },

  /* Update navbar login/register links after auth */
  updateNavbar: function() {
    var user = API.getUser();
    if (!user) return;
    var loginLink    = document.getElementById('nav-login-link');
    var registerLink = document.getElementById('nav-register-link');
    if (loginLink)    { loginLink.textContent = '👤 ' + user.username; loginLink.href = '#'; }
    if (registerLink) {
      registerLink.textContent = 'Logout';
      registerLink.href = '#';
      registerLink.addEventListener('click', function(e){
        e.preventDefault();
        API.auth.logout();
      });
    }
  }
};

/* ── Run on every page ── */
document.addEventListener('DOMContentLoaded', function(){
  API.initCartBadge();
  API.updateNavbar();
});
