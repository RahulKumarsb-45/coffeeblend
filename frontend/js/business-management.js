/**
 * CoffeeBlend — Complete Business Management Center & Product Management Workspace
 * Full-color SaaS administrative dashboard logic for all 21 modules.
 */

(function (window, $) {
  'use strict';

  var chartInstances = {};

  var BM = {
    currentSection: 'hub',
    cachedData: {},

    init: function () {
      BM.bindGlobalEvents();
    },

    // ── Navigation & Section Switching ──
    openWorkspace: function () {
      $('#cb-content').hide();
      $('#cb-business-management-workspace').show();
      window.scrollTo({ top: 100, behavior: 'smooth' });
      BM.showSection('hub');
    },

    closeWorkspace: function () {
      $('#cb-business-management-workspace').hide();
      $('#cb-content').show();
      window.scrollTo({ top: 150, behavior: 'smooth' });
    },

    showSection: function (sectionId) {
      BM.currentSection = sectionId;
      $('.bm-section-view').removeClass('active');

      if (sectionId === 'hub') {
        $('#bm-view-hub').addClass('active');
        $('#bm-current-breadcrumb').text('Management Hub');
        $('#bm-breadcrumb-nav').hide();
      } else {
        $('#bm-view-hub').removeClass('active');
        $('#bm-view-' + sectionId).addClass('active');
        var sectionTitle = BM.getSectionTitle(sectionId);
        $('#bm-current-breadcrumb').text(sectionTitle);
        $('#bm-breadcrumb-nav').show();

        // Trigger section loader
        BM.loadSectionData(sectionId);
      }
    },

    getSectionTitle: function (id) {
      var map = {
        overview: 'Overview',
        analytics: 'Analytics Dashboard',
        orders: 'Orders Management',
        products: 'Products & Menu',
        inventory: 'Inventory & Ingredients',
        customers: 'Customer Management',
        loyalty: 'Loyalty Program',
        coupons: 'Coupons & Offers',
        marketing: 'Marketing Campaigns',
        bookings: 'Bookings Management',
        reviews: 'Reviews & Feedback',
        roadmap: 'Product Roadmap',
        problems: 'Customer Problem Backlog',
        prioritization: 'Feature Prioritization',
        experiments: 'Experiments & A/B Testing',
        funnel: 'Product Funnel',
        goals: 'Product Goals & KPIs',
        decisions: 'Product Decision Log',
        reports: 'Reports & CSV Export',
        settings: 'Settings',
        activity: 'Admin Activity Log'
      };
      return map[id] || 'Dashboard';
    },

    bindGlobalEvents: function () {
      // Open workspace entry button
      $(document).on('click', '#btn-open-business-management', function (e) {
        e.preventDefault();
        BM.openWorkspace();
      });

      // Close workspace / Back to profile
      $(document).on('click', '.bm-btn-back-to-profile', function (e) {
        e.preventDefault();
        BM.closeWorkspace();
      });

      // Back to hub
      $(document).on('click', '.bm-btn-back-to-hub', function (e) {
        e.preventDefault();
        BM.showSection('hub');
      });

      // Feature card click
      $(document).on('click', '.bm-feature-card', function () {
        var targetSection = $(this).data('section');
        if (targetSection) {
          BM.showSection(targetSection);
        }
      });

      // Quick switcher links
      $(document).on('click', '[data-jump-section]', function (e) {
        e.preventDefault();
        var target = $(this).data('jump-section');
        if (target) {
          BM.showSection(target);
        }
      });

      // Refresh button
      $(document).on('click', '#bm-btn-refresh', function () {
        API.showAlert('Refreshing ' + BM.getSectionTitle(BM.currentSection) + '...');
        if (BM.currentSection === 'hub') {
          API.showAlert('Workspace ready.');
        } else {
          BM.loadSectionData(BM.currentSection);
        }
      });

      // Modals close
      $(document).on('click', '.bm-modal-close, [data-dismiss="bm-modal"]', function () {
        $('.bm-modal-backdrop').removeClass('show');
      });

      // Close modal on backdrop click
      $(document).on('click', '.bm-modal-backdrop', function (e) {
        if ($(e.target).hasClass('bm-modal-backdrop')) {
          $('.bm-modal-backdrop').removeClass('show');
        }
      });
    },

    loadSectionData: function (sectionId) {
      switch (sectionId) {
        case 'overview':       BM.overview.load(); break;
        case 'analytics':      BM.analytics.load(); break;
        case 'orders':         BM.orders.load(); break;
        case 'products':       BM.products.load(); break;
        case 'inventory':      BM.inventory.load(); break;
        case 'customers':      BM.customers.load(); break;
        case 'loyalty':        BM.loyalty.load(); break;
        case 'coupons':        BM.coupons.load(); break;
        case 'marketing':      BM.marketing.load(); break;
        case 'bookings':       BM.bookings.load(); break;
        case 'reviews':        BM.reviews.load(); break;
        case 'roadmap':        BM.roadmap.load(); break;
        case 'problems':       BM.problems.load(); break;
        case 'prioritization': BM.prioritization.load(); break;
        case 'experiments':    BM.experiments.load(); break;
        case 'funnel':         BM.funnel.load(); break;
        case 'goals':          BM.goals.load(); break;
        case 'decisions':      BM.decisions.load(); break;
        case 'reports':        BM.reports.load(); break;
        case 'settings':       BM.settings.load(); break;
        case 'activity':       BM.activity.load(); break;
      }
    },

    destroyChart: function (chartId) {
      if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
      }
    },

    // ============================================
    // 1. OVERVIEW
    // ============================================
    overview: {
      load: function () {
        API.management.getOverview().then(function (res) {
          if (!res || !res.success || !res.data) return;
          var d = res.data;

          $('#ov-today-orders').text(d.todayOrdersCount);
          $('#ov-today-revenue').text(API.formatINR(d.todayRevenue));
          $('#ov-eligible-revenue').text(API.formatINR(d.eligibleRevenue));
          $('#ov-pending-orders').text(d.pendingOrdersCount);
          $('#ov-completed-orders').text(d.completedOrdersCount);
          $('#ov-aov').text(API.formatINR(d.averageOrderValue));
          $('#ov-bestseller').text(d.bestSellingProduct.name + ' (' + d.bestSellingProduct.count + ' sold)');
          $('#ov-lowstock-count').text(d.lowStockAlertsCount + ' items');

          // Recent action orders
          var container = $('#ov-recent-orders-list');
          if (!d.recentOrdersNeedingAction || d.recentOrdersNeedingAction.length === 0) {
            container.html('<div class="p-3 text-muted text-center">No pending orders requiring action right now. All caught up! ☕</div>');
          } else {
            var html = '';
            d.recentOrdersNeedingAction.forEach(function (o) {
              var cust = o.user ? o.user.username : (o.shippingAddress?.firstName || 'Customer');
              var itemsStr = (o.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join(', ');
              html += '<div class="p-3 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">' +
                '<div>' +
                  '<strong>#' + o._id.slice(-6).toUpperCase() + ' • ' + cust + '</strong><br>' +
                  '<span style="font-size:0.82rem; color:#64748b;">' + itemsStr + ' • <span style="color:#582f14; font-weight:600;">' + (o.fulfilmentType || 'pickup') + '</span></span>' +
                '</div>' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<span class="bm-badge bm-badge-' + o.status + '">' + o.status + '</span>' +
                  '<strong style="color:#582f14;">' + API.formatINR(o.totalAmount || 0) + '</strong>' +
                  '<button type="button" class="bm-btn-primary bm-btn-sm" data-jump-section="orders">Manage &rarr;</button>' +
                '</div>' +
              '</div>';
            });
            container.html(html);
          }
        }).catch(function (err) {
          console.error(err);
        });
      }
    },

    // ============================================
    // 2. ANALYTICS DASHBOARD
    // ============================================
    analytics: {
      load: function () {
        var timeRange = $('#analytics-range-select').val() || '30d';
        var startDate = $('#analytics-start-date').val() || '';
        var endDate = $('#analytics-end-date').val() || '';

        API.management.getAnalytics(timeRange, startDate, endDate).then(function (res) {
          if (!res || !res.success) return;
          var k = res.kpis;
          var c = res.charts;

          // KPI Cards
          $('#an-revenue').text(API.formatINR(k.eligibleRevenue));
          $('#an-orders').text(k.totalOrders);
          $('#an-completed').text(k.completedOrders);
          $('#an-pending').text(k.pendingOrders);
          $('#an-aov').text(API.formatINR(k.averageOrderValue));
          $('#an-repeat').text(k.repeatRate);
          $('#an-lowstock').text(k.lowStockCount);

          if (c.topProducts && c.topProducts.length > 0) {
            $('#an-bestseller').text(c.topProducts[0].name);
          } else {
            $('#an-bestseller').text('—');
          }

          // Render Charts using Chart.js if available
          if (typeof Chart !== 'undefined') {
            BM.analytics.renderRevenueChart(c.revenueTrend);
            BM.analytics.renderCategoryChart(c.categorySales);
            BM.analytics.renderStatusChart(c.statusDistribution);
            BM.analytics.renderProductChart(c.topProducts);
            BM.analytics.renderPeakHoursChart(c.peakHours);
            BM.analytics.renderFunnelChart(c.funnel);
          }
        }).catch(function (err) {
          console.error(err);
        });
      },

      renderRevenueChart: function (data) {
        BM.destroyChart('chart-revenue');
        var ctx = document.getElementById('chart-revenue');
        if (!ctx) return;

        var labels = (data || []).map(function (d) { return d.date.slice(5); });
        var revenues = (data || []).map(function (d) { return d.revenue; });

        chartInstances['chart-revenue'] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
              label: 'Eligible Revenue (₹)',
              data: revenues.length > 0 ? revenues : [0],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: '#1d4ed8'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (val) { return '₹' + val; }
                }
              }
            }
          }
        });
      },

      renderCategoryChart: function (categories) {
        BM.destroyChart('chart-categories');
        var ctx = document.getElementById('chart-categories');
        if (!ctx) return;

        var labels = Object.keys(categories || {});
        var values = Object.values(categories || {});

        chartInstances['chart-categories'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels.length > 0 ? labels : ['Coffee', 'Drinks'],
            datasets: [{
              data: values.length > 0 ? values : [1, 1],
              backgroundColor: ['#582f14', '#c49b63', '#0d9488', '#ea580c', '#8b5cf6', '#ec4899']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      },

      renderStatusChart: function (statusMap) {
        BM.destroyChart('chart-statuses');
        var ctx = document.getElementById('chart-statuses');
        if (!ctx) return;

        var labels = Object.keys(statusMap || {});
        var values = Object.values(statusMap || {});

        chartInstances['chart-statuses'] = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: ['#f59e0b', '#7e22ce', '#3b82f6', '#06b6d4', '#6366f1', '#10b981', '#15803d', '#ef4444']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      },

      renderProductChart: function (products) {
        BM.destroyChart('chart-products');
        var ctx = document.getElementById('chart-products');
        if (!ctx) return;

        var prods = (products || []).slice(0, 6);
        var labels = prods.map(function (p) { return p.name; });
        var revenues = prods.map(function (p) { return p.revenue; });

        chartInstances['chart-products'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Revenue (₹)',
              data: revenues,
              backgroundColor: '#582f14',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { callback: function (val) { return '₹' + val; } }
              }
            }
          }
        });
      },

      renderPeakHoursChart: function (peakHours) {
        BM.destroyChart('chart-peak-hours');
        var ctx = document.getElementById('chart-peak-hours');
        if (!ctx) return;

        var labels = (peakHours || []).map(function (h) { return h.hour; });
        var counts = (peakHours || []).map(function (h) { return h.count; });

        chartInstances['chart-peak-hours'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Orders',
              data: counts,
              backgroundColor: '#8b5cf6',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        });
      },

      renderFunnelChart: function (funnel) {
        BM.destroyChart('chart-funnel');
        var ctx = document.getElementById('chart-funnel');
        if (!ctx) return;

        var f = funnel || { productViews: 0, addToCart: 0, checkoutStarts: 0, ordersCompleted: 0 };
        var labels = ['Product Views', 'Add to Cart', 'Checkout Starts', 'Completed Orders'];
        var values = [f.productViews, f.addToCart, f.checkoutStarts, f.ordersCompleted];

        chartInstances['chart-funnel'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Users / Sessions',
              data: values,
              backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    },

    // ============================================
    // 3. ORDERS MANAGEMENT
    // ============================================
    orders: {
      load: function () {
        API.orders.adminGetAll().then(function (res) {
          var container = $('#bm-orders-tbody');
          if (!res || !res.success || !res.orders || res.orders.length === 0) {
            container.html('<tr><td colspan="7" class="text-center text-muted p-4">No customer orders recorded yet.</td></tr>');
            return;
          }

          BM.cachedData.orders = res.orders;
          BM.orders.renderTable(res.orders);
        }).catch(function (err) {
          $('#bm-orders-tbody').html('<tr><td colspan="7" class="text-danger p-4 text-center">Failed to load orders.</td></tr>');
        });
      },

      renderTable: function (orders) {
        var query = ($('#bm-order-search').val() || '').toLowerCase().trim();
        var statusFilter = $('#bm-order-status-filter').val() || 'all';
        var typeFilter = $('#bm-order-type-filter').val() || 'all';

        var filtered = orders.filter(function (o) {
          var cust = ((o.user && o.user.username) ? o.user.username : (o.shippingAddress?.firstName || '')).toLowerCase();
          var id = o._id.toLowerCase();
          var matchesSearch = !query || id.includes(query) || cust.includes(query);
          var matchesStatus = statusFilter === 'all' || o.status === statusFilter;
          var matchesType = typeFilter === 'all' || o.fulfilmentType === typeFilter;
          return matchesSearch && matchesStatus && matchesType;
        });

        var html = '';
        if (filtered.length === 0) {
          $('#bm-orders-tbody').html('<tr><td colspan="7" class="text-center text-muted p-4">No matching orders found.</td></tr>');
          return;
        }

        filtered.forEach(function (o) {
          var cust = o.user ? (o.user.username + ' (' + (o.user.email || o.user.phone || '') + ')') : (o.shippingAddress?.firstName || 'Customer');
          var itemsStr = (o.items || []).map(function (i) { return i.name + ' x' + i.quantity; }).join(', ');
          var dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

          html += '<tr>' +
            '<td><strong>#' + o._id.slice(-6).toUpperCase() + '</strong></td>' +
            '<td>' + cust + '</td>' +
            '<td><span style="font-size:0.84rem;">' + itemsStr + '</span></td>' +
            '<td><strong style="color:#582f14;">' + API.formatINR(o.totalAmount || 0) + '</strong><br><small class="text-muted">' + (o.paymentMethod || 'COD') + '</small></td>' +
            '<td><span style="text-transform:capitalize; font-weight:600; font-size:0.8rem; color:#582f14;">' + (o.fulfilmentType || 'pickup') + '</span></td>' +
            '<td><span class="bm-badge bm-badge-' + o.status + '">' + o.status + '</span></td>' +
            '<td>' +
              '<div class="dropdown d-inline-block">' +
                '<select class="bm-select bm-btn-sm btn-order-change-status" data-id="' + o._id + '" style="font-size:0.8rem;">' +
                  '<option value="" disabled selected>Update...</option>' +
                  '<option value="confirmed">Confirm</option>' +
                  '<option value="preparing">Preparing</option>' +
                  '<option value="ready">Ready</option>' +
                  '<option value="completed">Complete</option>' +
                  '<option value="cancelled">Cancel</option>' +
                '</select>' +
              '</div>' +
            '</td>' +
          '</tr>';
        });

        $('#bm-orders-tbody').html(html);
      }
    },

    // ============================================
    // 4. PRODUCTS & MENU
    // ============================================
    products: {
      load: function () {
        API.menu.getAll(null, null).then(function (res) {
          if (!res || !res.products) return;
          BM.cachedData.products = res.products;
          BM.products.renderTable(res.products);
        });
      },

      renderTable: function (products) {
        var query = ($('#bm-product-search').val() || '').toLowerCase().trim();
        var catFilter = $('#bm-product-cat-filter').val() || 'all';

        var filtered = products.filter(function (p) {
          var matchSearch = !query || p.name.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query);
          var matchCat = catFilter === 'all' || p.category.toLowerCase() === catFilter.toLowerCase();
          return matchSearch && matchCat;
        });

        var html = '';
        if (filtered.length === 0) {
          $('#bm-products-tbody').html('<tr><td colspan="6" class="text-center text-muted p-4">No products found.</td></tr>');
          return;
        }

        filtered.forEach(function (p) {
          html += '<tr>' +
            '<td><img src="' + (p.image || 'images/menu-1.jpg') + '" style="width:42px; height:42px; border-radius:8px; object-fit:cover;"></td>' +
            '<td><strong>' + p.name + '</strong><br><small class="text-muted">' + (p.description || '').slice(0, 50) + '...</small></td>' +
            '<td><span class="bm-badge bm-badge-inactive" style="text-transform:uppercase;">' + p.category + '</span></td>' +
            '<td><strong>' + API.formatINR(p.price) + '</strong></td>' +
            '<td>' +
              '<button type="button" class="btn btn-sm btn-product-toggle ' + (p.isAvailable ? 'btn-outline-success' : 'btn-outline-secondary') + '" data-id="' + p._id + '" data-avail="' + p.isAvailable + '" style="font-size:0.75rem; border-radius:20px;">' +
                (p.isAvailable ? '✅ Active' : '⏸ Inactive') +
              '</button>' +
            '</td>' +
            '<td>' +
              '<button type="button" class="btn btn-sm btn-outline-danger btn-product-delete" data-id="' + p._id + '" style="font-size:0.75rem;">Deactivate</button>' +
            '</td>' +
          '</tr>';
        });

        $('#bm-products-tbody').html(html);
      }
    },

    // ============================================
    // 5. INVENTORY & INGREDIENTS
    // ============================================
    inventory: {
      load: function () {
        API.inventory.list().then(function (res) {
          if (!res || !res.inventory) return;
          BM.cachedData.inventory = res.inventory;
          BM.inventory.renderTable(res.inventory);
        });
      },

      renderTable: function (inventory) {
        var html = '';
        inventory.forEach(function (i) {
          var isOut = i.stockQuantity <= 0;
          var isLow = i.stockQuantity <= i.minThreshold;
          var badgeClass = isOut ? 'bm-badge-outofstock' : (isLow ? 'bm-badge-lowstock' : 'bm-badge-completed');
          var badgeText = isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'Good');

          html += '<tr>' +
            '<td><strong>' + i.name + '</strong></td>' +
            '<td><span class="bm-badge bm-badge-inactive">' + i.category + '</span></td>' +
            '<td><strong>' + i.stockQuantity + ' ' + i.unit + '</strong></td>' +
            '<td>' + i.minThreshold + ' ' + i.unit + '</td>' +
            '<td>₹' + (i.costPerUnit || 0) + ' / ' + i.unit + '</td>' +
            '<td><span class="bm-badge ' + badgeClass + '">' + badgeText + '</span></td>' +
            '<td>' +
              '<button type="button" class="bm-btn-primary bm-btn-sm btn-quick-restock" data-id="' + i._id + '">+ Restock 10</button>' +
            '</td>' +
          '</tr>';
        });
        $('#bm-inventory-tbody').html(html);
      }
    },

    // ============================================
    // 6. CUSTOMER MANAGEMENT
    // ============================================
    customers: {
      load: function () {
        var search = $('#bm-customer-search').val() || '';
        API.management.getCustomers(search, 1, 30).then(function (res) {
          if (!res || !res.customers) return;
          var html = '';
          res.customers.forEach(function (c) {
            html += '<tr>' +
              '<td><strong>' + c.username + '</strong>' + (c.role === 'admin' ? ' <span class="badge badge-warning text-dark">Admin</span>' : '') + '</td>' +
              '<td>' + c.email + '</td>' +
              '<td>' + (c.phone || '—') + '</td>' +
              '<td>' + (c.city || 'Mumbai') + '</td>' +
              '<td><strong>' + c.totalOrders + '</strong> orders ' + (c.isRepeatCustomer ? '<span class="badge badge-info">Repeat</span>' : '') + '</td>' +
              '<td><strong style="color:#582f14;">' + API.formatINR(c.totalSpent) + '</strong></td>' +
              '<td><span class="badge badge-warning text-dark font-weight-bold">' + (c.loyaltyPoints || 0) + ' pts</span></td>' +
              '<td>' + new Date(c.createdAt).toLocaleDateString('en-IN') + '</td>' +
            '</tr>';
          });
          $('#bm-customers-tbody').html(html);
        });
      }
    },

    // ============================================
    // 7. LOYALTY PROGRAM
    // ============================================
    loyalty: {
      load: function () {
        API.management.getLoyalty().then(function (res) {
          if (!res || !res.transactions) return;
          var html = '';
          res.transactions.forEach(function (tx) {
            var cust = tx.user ? tx.user.username : 'Customer';
            var isEarn = tx.points > 0;
            html += '<tr>' +
              '<td>' + new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td>' +
              '<td><strong>' + cust + '</strong></td>' +
              '<td><strong style="color:' + (isEarn ? '#10b981' : '#ef4444') + ';">' + (isEarn ? '+' : '') + tx.points + ' pts</strong></td>' +
              '<td><span class="bm-badge bm-badge-' + (isEarn ? 'completed' : 'cancelled') + '">' + tx.type + '</span></td>' +
              '<td>' + tx.description + '</td>' +
              '<td><strong>' + (tx.balanceAfter || 0) + ' pts</strong></td>' +
            '</tr>';
          });
          $('#bm-loyalty-tbody').html(html);
        });
      }
    },

    // ============================================
    // 8. COUPONS & OFFERS
    // ============================================
    coupons: {
      load: function () {
        API.coupons.getAll().then(function (res) {
          if (!res || !res.coupons) return;
          var html = '';
          res.coupons.forEach(function (c) {
            html += '<tr>' +
              '<td><strong style="color:#582f14; font-size:1.05rem;">' + c.code + '</strong></td>' +
              '<td>' + c.description + '</td>' +
              '<td><strong>' + (c.discountType === 'percentage' ? (c.discountValue + '%') : ('₹' + c.discountValue)) + '</strong></td>' +
              '<td>₹' + (c.minOrderValue || 0) + '</td>' +
              '<td>' + (c.usedCount || 0) + ' / ' + (c.usageLimit || '∞') + '</td>' +
              '<td>' + new Date(c.expiryDate).toLocaleDateString('en-IN') + '</td>' +
              '<td><span class="bm-badge ' + (c.isActive ? 'bm-badge-completed' : 'bm-badge-inactive') + '">' + (c.isActive ? 'Active' : 'Inactive') + '</span></td>' +
              '<td>' +
                (c.isActive ? '<button type="button" class="btn btn-sm btn-outline-danger btn-coupon-deactivate" data-id="' + c._id + '">Deactivate</button>' : '<span class="text-muted">Expired</span>') +
              '</td>' +
            '</tr>';
          });
          $('#bm-coupons-tbody').html(html);
        });
      }
    },

    // ============================================
    // 9. MARKETING CAMPAIGNS
    // ============================================
    marketing: {
      load: function () {
        API.management.getCampaigns().then(function (res) {
          if (!res || !res.campaigns) return;
          var html = '';
          res.campaigns.forEach(function (cmp) {
            html += '<tr>' +
              '<td><strong>' + cmp.name + '</strong><br><small class="text-muted">' + cmp.subject + '</small></td>' +
              '<td><span class="bm-badge bm-badge-confirmed">' + cmp.channel + '</span></td>' +
              '<td>' + cmp.targetAudience + '</td>' +
              '<td><strong style="color:#582f14;">' + (cmp.discountCoupon || '—') + '</strong></td>' +
              '<td><span class="bm-badge ' + (cmp.status === 'Sent' ? 'bm-badge-completed' : 'bm-badge-pending') + '">' + cmp.status + '</span></td>' +
              '<td>' + (cmp.sentAt ? (new Date(cmp.sentAt).toLocaleDateString('en-IN') + ' (' + cmp.recipientCount + ' sent)') : 'Not sent') + '</td>' +
              '<td>' +
                (cmp.status !== 'Sent' ? '<button type="button" class="bm-btn-primary bm-btn-sm btn-campaign-send" data-id="' + cmp._id + '">🚀 Dispatch</button>' : '<span class="text-success font-weight-bold">✅ Sent</span>') +
              '</td>' +
            '</tr>';
          });
          $('#bm-campaigns-tbody').html(html);
        });
      }
    },

    // ============================================
    // 10. BOOKINGS MANAGEMENT
    // ============================================
    bookings: {
      load: function () {
        API.bookings.adminGetAll().then(function (res) {
          if (!res || !res.bookings) return;
          var html = '';
          res.bookings.forEach(function (b) {
            html += '<tr>' +
              '<td><strong>' + b.firstName + ' ' + (b.lastName || '') + '</strong></td>' +
              '<td>' + (b.phone || '—') + '</td>' +
              '<td><strong>' + b.date + '</strong> at ' + b.time + '</td>' +
              '<td><span class="badge badge-info">' + b.guests + ' Guests</span></td>' +
              '<td><small class="text-muted">' + (b.message || 'Standard table') + '</small></td>' +
              '<td><span class="bm-badge bm-badge-' + b.status + '">' + b.status + '</span></td>' +
              '<td>' +
                '<select class="bm-select bm-btn-sm btn-booking-change-status" data-id="' + b._id + '" style="font-size:0.8rem;">' +
                  '<option value="" disabled selected>Update...</option>' +
                  '<option value="confirmed">Confirm</option>' +
                  '<option value="cancelled">Cancel</option>' +
                '</select>' +
              '</td>' +
            '</tr>';
          });
          $('#bm-bookings-tbody').html(html);
        });
      }
    },

    // ============================================
    // 11. REVIEWS & FEEDBACK
    // ============================================
    reviews: {
      load: function () {
        API.reviews.list().then(function (res) {
          if (!res || !res.reviews) return;
          var html = '';
          res.reviews.forEach(function (r) {
            var prod = r.product ? r.product.name : 'CoffeeBlend Experience';
            var stars = '⭐'.repeat(r.rating || 5);
            html += '<tr>' +
              '<td><strong>' + (r.userName || 'Guest') + '</strong></td>' +
              '<td>' + prod + '</td>' +
              '<td><span style="color:#eab308; font-size:1rem;">' + stars + '</span> (' + r.rating + '/5)</td>' +
              '<td>"' + r.comment + '"</td>' +
              '<td>' + new Date(r.createdAt).toLocaleDateString('en-IN') + '</td>' +
              '<td><button type="button" class="btn btn-sm btn-outline-danger btn-review-delete" data-id="' + r._id + '">Remove</button></td>' +
            '</tr>';
          });
          $('#bm-reviews-tbody').html(html);
        });
      }
    },

    // ============================================
    // 12. PRODUCT ROADMAP
    // ============================================
    roadmap: {
      load: function () {
        API.management.getRoadmap().then(function (res) {
          if (!res || !res.items) return;
          var html = '';
          res.items.forEach(function (it) {
            html += '<tr>' +
              '<td><strong>' + it.title + '</strong><br><small class="text-muted">' + it.description + '</small></td>' +
              '<td><span class="bm-badge bm-badge-confirmed">' + it.category + '</span></td>' +
              '<td><span class="badge badge-dark">' + it.milestone + '</span></td>' +
              '<td>' + it.owner + '</td>' +
              '<td><span class="badge badge-' + (it.priority === 'Critical' ? 'danger' : (it.priority === 'High' ? 'warning' : 'secondary')) + '">' + it.priority + '</span></td>' +
              '<td><span class="bm-badge bm-badge-' + (it.status === 'Released' ? 'completed' : 'preparing') + '">' + it.status + '</span></td>' +
              '<td>' +
                '<select class="bm-select bm-btn-sm btn-roadmap-change-status" data-id="' + it._id + '" style="font-size:0.78rem;">' +
                  '<option value="" disabled selected>Move to...</option>' +
                  '<option value="Backlog">Backlog</option>' +
                  '<option value="Planned">Planned</option>' +
                  '<option value="In Progress">In Progress</option>' +
                  '<option value="Testing">Testing</option>' +
                  '<option value="Released">Released</option>' +
                '</select>' +
              '</td>' +
            '</tr>';
          });
          $('#bm-roadmap-tbody').html(html);
        });
      }
    },

    // ============================================
    // 13. CUSTOMER PROBLEM BACKLOG
    // ============================================
    problems: {
      load: function () {
        API.management.getProblems().then(function (res) {
          if (!res || !res.problems) return;
          var html = '';
          res.problems.forEach(function (p) {
            html += '<tr>' +
              '<td><strong>' + p.title + '</strong><br><small class="text-muted">' + p.description + '</small></td>' +
              '<td>' + p.customerSegment + '</td>' +
              '<td><span class="badge badge-' + (p.severity === 'Critical' ? 'danger' : 'warning') + '">' + p.severity + '</span></td>' +
              '<td>' + p.frequency + '</td>' +
              '<td>' + p.affectedJourney + '</td>' +
              '<td><span class="bm-badge bm-badge-' + (p.status === 'Resolved' ? 'completed' : 'pending') + '">' + p.status + '</span></td>' +
              '<td>' +
                '<select class="bm-select bm-btn-sm btn-problem-change-status" data-id="' + p._id + '" style="font-size:0.78rem;">' +
                  '<option value="" disabled selected>Status...</option>' +
                  '<option value="Open">Open</option>' +
                  '<option value="Under Investigation">Investigating</option>' +
                  '<option value="Solution Designed">Solution Designed</option>' +
                  '<option value="Resolved">Resolved</option>' +
                '</select>' +
              '</td>' +
            '</tr>';
          });
          $('#bm-problems-tbody').html(html);
        });
      }
    },

    // ============================================
    // 14. FEATURE PRIORITIZATION (RICE)
    // ============================================
    prioritization: {
      load: function () {
        API.management.getPrioritization().then(function (res) {
          if (!res || !res.features) return;
          var html = '';
          res.features.forEach(function (f) {
            html += '<tr>' +
              '<td><strong>' + f.featureName + '</strong><br><small class="text-muted">' + (f.description || '') + '</small></td>' +
              '<td>' + f.reach + ' cust/qtr</td>' +
              '<td>' + f.impact + 'x</td>' +
              '<td>' + (f.confidence * 100) + '%</td>' +
              '<td>' + f.effort + ' sprints</td>' +
              '<td><strong style="color:#582f14; font-size:1.15rem;">' + f.riceScore + '</strong></td>' +
              '<td><span class="bm-badge bm-badge-confirmed">' + f.status + '</span></td>' +
            '</tr>';
          });
          $('#bm-prioritization-tbody').html(html);
        });
      }
    },

    // ============================================
    // 15. EXPERIMENTS & A/B TESTING
    // ============================================
    experiments: {
      load: function () {
        API.experiments.getReport('home_cta_v1').then(function (res) {
          if (!res || !res.summary || !res.summary.variants) return;
          var v = res.summary.variants;

          $('#exp-a-exposures').text(v.A.exposures || 0);
          $('#exp-a-clicks').text(v.A.clicks || 0);
          $('#exp-a-ctr').text(v.A.clickThroughRate || '0.0%');
          $('#exp-a-conversions').text(v.A.conversions || 0);
          $('#exp-a-cr').text(v.A.conversionRate || '0.0%');

          $('#exp-b-exposures').text(v.B.exposures || 0);
          $('#exp-b-clicks').text(v.B.clicks || 0);
          $('#exp-b-ctr').text(v.B.clickThroughRate || '0.0%');
          $('#exp-b-conversions').text(v.B.conversions || 0);
          $('#exp-b-cr').text(v.B.conversionRate || '0.0%');
        });
      }
    },

    // ============================================
    // 16. PRODUCT FUNNEL
    // ============================================
    funnel: {
      load: function () {
        API.management.getFunnel().then(function (res) {
          if (!res || !res.counts) return;
          var c = res.counts;
          var r = res.rates;

          $('#fn-views').text(c.productViews);
          $('#fn-carts').text(c.addToCart);
          $('#fn-checkouts').text(c.checkoutStarts);
          $('#fn-orders').text(c.ordersCompleted);

          $('#fn-rate-cart').text(r.viewToCart);
          $('#fn-rate-checkout').text(r.cartToCheckout);
          $('#fn-rate-order').text(r.checkoutToOrder);
          $('#fn-rate-overall').text(r.overallConversion);
        });
      }
    },

    // ============================================
    // 17. PRODUCT GOALS & KPIS
    // ============================================
    goals: {
      load: function () {
        API.management.getGoals().then(function (res) {
          if (!res || !res.goals) return;
          var html = '';
          res.goals.forEach(function (g) {
            html += '<tr>' +
              '<td><strong>' + g.metricName + '</strong></td>' +
              '<td>' + g.baselineValue + '</td>' +
              '<td><strong style="color:#582f14;">' + g.currentValue + '</strong></td>' +
              '<td><strong style="color:#10b981;">' + g.targetValue + '</strong></td>' +
              '<td>' + g.timeframe + '</td>' +
              '<td>' + g.owner + '</td>' +
              '<td><span class="bm-badge bm-badge-' + (g.status === 'On Track' ? 'completed' : (g.status === 'Achieved' ? 'confirmed' : 'lowstock')) + '">' + g.status + '</span></td>' +
            '</tr>';
          });
          $('#bm-goals-tbody').html(html);
        });
      }
    },

    // ============================================
    // 18. PRODUCT DECISION LOG
    // ============================================
    decisions: {
      load: function () {
        API.management.getDecisions().then(function (res) {
          if (!res || !res.decisions) return;
          var html = '';
          res.decisions.forEach(function (d) {
            html += '<div class="p-3 mb-3" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; border-left:4px solid #582f14;">' +
              '<div class="d-flex justify-content-between align-items-center mb-1">' +
                '<h5 style="color:#582f14; font-weight:700; margin:0;">' + d.decisionTitle + '</h5>' +
                '<small class="text-muted">' + new Date(d.date).toLocaleDateString('en-IN') + ' • ' + d.owner + '</small>' +
              '</div>' +
              '<p style="font-size:0.88rem; color:#334155; margin-bottom:8px;"><strong>Context:</strong> ' + d.context + '</p>' +
              '<p style="font-size:0.88rem; color:#334155; margin-bottom:8px;"><strong>Evidence:</strong> ' + d.supportingEvidence + '</p>' +
              '<div class="p-2" style="background:#f8fafc; border-radius:8px; font-size:0.84rem;">' +
                '<strong>Decision Made:</strong> ' + d.chosenDecision + '<br>' +
                '<strong>Expected Outcome:</strong> ' + d.expectedOutcome +
              '</div>' +
            '</div>';
          });
          $('#bm-decisions-list').html(html);
        });
      }
    },

    // ============================================
    // 19. REPORTS & CSV EXPORT
    // ============================================
    reports: {
      load: function () {
        // Ready state
      }
    },

    // ============================================
    // 20. SETTINGS
    // ============================================
    settings: {
      load: function () {
        API.management.getSettings().then(function (res) {
          if (!res || !res.settings) return;
          var s = res.settings;

          $('#set-open-time').val(s.operatingHours?.open || '08:00');
          $('#set-close-time').val(s.operatingHours?.close || '23:00');
          $('#set-max-radius').val(s.delivery?.maxRadiusKm || 10);
          $('#set-base-delivery-fee').val(s.delivery?.baseDeliveryFee || 40);
          $('#set-free-threshold').val(s.delivery?.freeDeliveryThreshold || 500);
          $('#set-points-rate').val(s.loyalty?.pointsPerRupeeSpent || 0.1);
          $('#set-contact-email').val(s.contact?.email || 'contact@coffeeblend.in');
          $('#set-contact-phone').val(s.contact?.phone || '+91 98200 12345');
        });
      }
    },

    // ============================================
    // 21. ADMIN ACTIVITY LOG
    // ============================================
    activity: {
      load: function () {
        API.management.getActivityLogs().then(function (res) {
          if (!res || !res.logs) return;
          var html = '';
          res.logs.forEach(function (l) {
            html += '<tr>' +
              '<td>' + new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td>' +
              '<td><strong>' + l.adminUser + '</strong></td>' +
              '<td><span class="bm-badge bm-badge-confirmed">' + l.section + '</span></td>' +
              '<td><span class="badge badge-dark">' + l.action + '</span></td>' +
              '<td>' + l.description + '</td>' +
              '<td><small class="text-muted">' + (l.ipAddress || '127.0.0.1') + '</small></td>' +
            '</tr>';
          });
          $('#bm-activity-tbody').html(html);
        });
      }
    }
  };

  // Bind Section Specific Actions (Forms & Modals)
  $(document).ready(function () {
    BM.init();

    // Orders Filter Events
    $(document).on('input', '#bm-order-search', function () {
      if (BM.cachedData.orders) BM.orders.renderTable(BM.cachedData.orders);
    });
    $(document).on('change', '#bm-order-status-filter, #bm-order-type-filter', function () {
      if (BM.cachedData.orders) BM.orders.renderTable(BM.cachedData.orders);
    });

    // Order Status Update
    $(document).on('change', '.btn-order-change-status', function () {
      var id = $(this).data('id');
      var status = $(this).val();
      if (!id || !status) return;

      var sel = $(this);
      sel.prop('disabled', true);
      API.orders.adminUpdateStatus(id, status).then(function (res) {
        sel.prop('disabled', false);
        if (res && res.success) {
          API.showAlert('Order #' + id.slice(-6).toUpperCase() + ' status updated to ' + status);
          BM.orders.load();
        } else {
          API.showAlert(res.message || 'Failed to update order', 'error');
        }
      }).catch(function () {
        sel.prop('disabled', false);
        API.showAlert('Server error updating order', 'error');
      });
    });

    // Product Availability Toggle
    $(document).on('click', '.btn-product-toggle', function () {
      var id = $(this).data('id');
      var currentAvail = $(this).data('avail') === true || $(this).data('avail') === 'true';
      var newAvail = !currentAvail;
      var btn = $(this);
      btn.prop('disabled', true);

      API.menu.toggleAvailability(id, newAvail).then(function (res) {
        btn.prop('disabled', false);
        if (res && res.success) {
          API.showAlert(res.message || 'Product updated');
          BM.products.load();
        } else {
          API.showAlert(res.message || 'Error updating product', 'error');
        }
      });
    });

    // Product Deactivate
    $(document).on('click', '.btn-product-delete', function () {
      var id = $(this).data('id');
      if (!confirm('Safely deactivate this product? Existing orders will remain preserved.')) return;
      API.menu.toggleAvailability(id, false).then(function (res) {
        if (res.success) {
          API.showAlert('Product deactivated safely');
          BM.products.load();
        }
      });
    });

    // Quick Restock Action
    $(document).on('click', '.btn-quick-restock', function () {
      var id = $(this).data('id');
      var btn = $(this);
      btn.prop('disabled', true).text('Restocking...');
      API.inventory.adjust(id, 10, 'Admin quick restock').then(function (res) {
        btn.prop('disabled', false).text('+ Restock 10');
        if (res && res.success) {
          API.showAlert('Restocked +10 units!');
          BM.inventory.load();
        } else {
          API.showAlert(res.message || 'Restock failed', 'error');
        }
      });
    });

    // Booking Status Update
    $(document).on('change', '.btn-booking-change-status', function () {
      var id = $(this).data('id');
      var status = $(this).val();
      if (!id || !status) return;

      var sel = $(this);
      sel.prop('disabled', true);
      API.bookings.adminUpdateStatus(id, status).then(function (res) {
        sel.prop('disabled', false);
        if (res && res.success) {
          API.showAlert('Reservation status changed to ' + status);
          BM.bookings.load();
        } else {
          API.showAlert(res.message || 'Update failed', 'error');
        }
      });
    });

    // Review Remove
    $(document).on('click', '.btn-review-delete', function () {
      var id = $(this).data('id');
      if (!confirm('Remove this review from publication?')) return;
      API.reviews.remove(id).then(function (res) {
        if (res.success) {
          API.showAlert('Review deleted');
          BM.reviews.load();
        }
      });
    });

    // Coupon Deactivate
    $(document).on('click', '.btn-coupon-deactivate', function () {
      var id = $(this).data('id');
      if (!confirm('Deactivate coupon code?')) return;
      API.coupons.remove(id).then(function (res) {
        if (res.success) {
          API.showAlert('Coupon deactivated');
          BM.coupons.load();
        }
      });
    });

    // Campaign Dispatch
    $(document).on('click', '.btn-campaign-send', function () {
      var id = $(this).data('id');
      var btn = $(this);
      btn.prop('disabled', true).text('Dispatching...');
      API.management.sendCampaign(id).then(function (res) {
        btn.prop('disabled', false).text('🚀 Dispatch');
        if (res && res.success) {
          API.showAlert(res.message || 'Campaign sent!');
          BM.marketing.load();
        } else {
          API.showAlert(res.message || 'Campaign send failed', 'error');
        }
      });
    });

    // Roadmap Status Update
    $(document).on('change', '.btn-roadmap-change-status', function () {
      var id = $(this).data('id');
      var status = $(this).val();
      if (!id || !status) return;
      API.management.updateRoadmap(id, { status: status }).then(function (res) {
        if (res.success) {
          API.showAlert('Feature status updated');
          BM.roadmap.load();
        }
      });
    });

    // Problem Status Update
    $(document).on('change', '.btn-problem-change-status', function () {
      var id = $(this).data('id');
      var status = $(this).val();
      if (!id || !status) return;
      API.management.updateProblem(id, { status: status }).then(function (res) {
        if (res.success) {
          API.showAlert('Problem status updated');
          BM.problems.load();
        }
      });
    });

    // Settings Form Save
    $(document).on('submit', '#bm-settings-form', function (e) {
      e.preventDefault();
      var data = {
        operatingHours: {
          open: $('#set-open-time').val(),
          close: $('#set-close-time').val()
        },
        delivery: {
          maxRadiusKm: parseFloat($('#set-max-radius').val()),
          baseDeliveryFee: parseFloat($('#set-base-delivery-fee').val()),
          freeDeliveryThreshold: parseFloat($('#set-free-threshold').val())
        },
        loyalty: {
          pointsPerRupeeSpent: parseFloat($('#set-points-rate').val())
        },
        contact: {
          email: $('#set-contact-email').val(),
          phone: $('#set-contact-phone').val()
        }
      };

      var btn = $('#btn-save-settings');
      btn.prop('disabled', true).text('Saving...');
      API.management.updateSettings(data).then(function (res) {
        btn.prop('disabled', false).text('Save Settings');
        if (res && res.success) {
          API.showAlert('Store configuration saved successfully!');
        } else {
          API.showAlert(res.message || 'Failed to save settings', 'error');
        }
      }).catch(function () {
        btn.prop('disabled', false).text('Save Settings');
        API.showAlert('Server error saving settings', 'error');
      });
    });

    // Analytics Range Select
    $(document).on('change', '#analytics-range-select', function () {
      if ($(this).val() === 'custom') {
        $('#analytics-custom-dates').show();
      } else {
        $('#analytics-custom-dates').hide();
        BM.analytics.load();
      }
    });

    $(document).on('click', '#btn-analytics-custom-apply', function () {
      BM.analytics.load();
    });

    // New Product Form Submit
    $(document).on('submit', '#form-new-product', function (e) {
      e.preventDefault();
      var data = {
        name: $('#new-prod-name').val().trim(),
        category: $('#new-prod-category').val(),
        price: parseFloat($('#new-prod-price').val()),
        image: $('#new-prod-image').val().trim() || 'images/menu-1.jpg',
        description: $('#new-prod-desc').val().trim(),
        isAvailable: true,
        isFeatured: $('#new-prod-featured').is(':checked')
      };

      API.menu.create(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Product "' + data.name + '" added to menu!');
          $('#modal-new-product').removeClass('show');
          $('#form-new-product')[0].reset();
          BM.products.load();
        } else {
          API.showAlert(res.message || 'Failed to create product', 'error');
        }
      });
    });

    // New Coupon Form Submit
    $(document).on('submit', '#form-new-coupon', function (e) {
      e.preventDefault();
      var data = {
        code: $('#new-coupon-code').val().trim(),
        description: $('#new-coupon-desc').val().trim(),
        discountType: $('#new-coupon-type').val(),
        discountValue: parseFloat($('#new-coupon-val').val()),
        minOrderValue: parseFloat($('#new-coupon-min').val()) || 0,
        expiryDate: $('#new-coupon-expiry').val()
      };

      API.coupons.create(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Coupon ' + data.code + ' activated!');
          $('#modal-new-coupon').removeClass('show');
          $('#form-new-coupon')[0].reset();
          BM.coupons.load();
        } else {
          API.showAlert(res.message || 'Failed to create coupon', 'error');
        }
      });
    });

    // New Campaign Form Submit
    $(document).on('submit', '#form-new-campaign', function (e) {
      e.preventDefault();
      var data = {
        name: $('#new-cmp-name').val().trim(),
        channel: $('#new-cmp-channel').val(),
        targetAudience: $('#new-cmp-audience').val(),
        subject: $('#new-cmp-subject').val().trim(),
        discountCoupon: $('#new-cmp-coupon').val().trim(),
        content: $('#new-cmp-content').val().trim()
      };

      API.management.createCampaign(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Campaign created!');
          $('#modal-new-campaign').removeClass('show');
          $('#form-new-campaign')[0].reset();
          BM.marketing.load();
        } else {
          API.showAlert(res.message || 'Error creating campaign', 'error');
        }
      });
    });

    // New Roadmap Item Form Submit
    $(document).on('submit', '#form-new-roadmap', function (e) {
      e.preventDefault();
      var data = {
        title: $('#new-rd-title').val().trim(),
        description: $('#new-rd-desc').val().trim(),
        category: $('#new-rd-category').val(),
        priority: $('#new-rd-priority').val(),
        milestone: $('#new-rd-milestone').val().trim() || 'v2.0',
        owner: $('#new-rd-owner').val().trim() || 'Product Team',
        status: $('#new-rd-status').val()
      };

      API.management.createRoadmap(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Feature added to roadmap!');
          $('#modal-new-roadmap').removeClass('show');
          $('#form-new-roadmap')[0].reset();
          BM.roadmap.load();
        } else {
          API.showAlert(res.message || 'Error adding roadmap item', 'error');
        }
      });
    });

    // New Problem Form Submit
    $(document).on('submit', '#form-new-problem', function (e) {
      e.preventDefault();
      var data = {
        title: $('#new-pb-title').val().trim(),
        description: $('#new-pb-desc').val().trim(),
        customerSegment: $('#new-pb-segment').val(),
        severity: $('#new-pb-severity').val(),
        frequency: $('#new-pb-frequency').val(),
        affectedJourney: $('#new-pb-journey').val(),
        source: $('#new-pb-source').val()
      };

      API.management.createProblem(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Customer problem logged!');
          $('#modal-new-problem').removeClass('show');
          $('#form-new-problem')[0].reset();
          BM.problems.load();
        } else {
          API.showAlert(res.message || 'Error logging problem', 'error');
        }
      });
    });

    // New Feature Prioritization Form Submit
    $(document).on('submit', '#form-new-prioritization', function (e) {
      e.preventDefault();
      var data = {
        featureName: $('#new-rice-name').val().trim(),
        description: $('#new-rice-desc').val().trim(),
        reach: parseFloat($('#new-rice-reach').val()),
        impact: parseFloat($('#new-rice-impact').val()),
        confidence: parseFloat($('#new-rice-confidence').val()),
        effort: parseFloat($('#new-rice-effort').val())
      };

      API.management.createPrioritization(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Feature added with RICE Score ' + res.feature.riceScore + '!');
          $('#modal-new-prioritization').removeClass('show');
          $('#form-new-prioritization')[0].reset();
          BM.prioritization.load();
        } else {
          API.showAlert(res.message || 'Error saving feature', 'error');
        }
      });
    });

    // New Goal Form Submit
    $(document).on('submit', '#form-new-goal', function (e) {
      e.preventDefault();
      var data = {
        metricName: $('#new-goal-metric').val().trim(),
        baselineValue: $('#new-goal-baseline').val().trim(),
        currentValue: $('#new-goal-current').val().trim(),
        targetValue: $('#new-goal-target').val().trim(),
        timeframe: $('#new-goal-timeframe').val().trim(),
        owner: $('#new-goal-owner').val().trim(),
        status: $('#new-goal-status').val()
      };

      API.management.createGoal(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Product Goal created!');
          $('#modal-new-goal').removeClass('show');
          $('#form-new-goal')[0].reset();
          BM.goals.load();
        } else {
          API.showAlert(res.message || 'Error creating goal', 'error');
        }
      });
    });

    // New Decision Form Submit
    $(document).on('submit', '#form-new-decision', function (e) {
      e.preventDefault();
      var data = {
        decisionTitle: $('#new-dec-title').val().trim(),
        context: $('#new-dec-context').val().trim(),
        supportingEvidence: $('#new-dec-evidence').val().trim(),
        alternativesConsidered: $('#new-dec-alts').val().trim(),
        chosenDecision: $('#new-dec-chosen').val().trim(),
        expectedOutcome: $('#new-dec-outcome').val().trim(),
        owner: $('#new-dec-owner').val().trim() || 'Product Team'
      };

      API.management.createDecision(data).then(function (res) {
        if (res && res.success) {
          API.showAlert('Decision logged!');
          $('#modal-new-decision').removeClass('show');
          $('#form-new-decision')[0].reset();
          BM.decisions.load();
        } else {
          API.showAlert(res.message || 'Error logging decision', 'error');
        }
      });
    });

    // Open Modal buttons
    $(document).on('click', '[data-open-modal]', function () {
      var modalId = $(this).data('open-modal');
      $('#' + modalId).addClass('show');
    });

    // CSV Export buttons
    $(document).on('click', '.btn-export-csv', function () {
      var type = $(this).data('type');
      if (!type) return;
      var token = API.getToken();
      var url = API.management.getExportUrl(type);

      // Download trigger via fetch blob to include authorization header
      fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) {
          if (!r.ok) throw new Error('Download failed');
          return r.blob();
        })
        .then(function (blob) {
          var blobUrl = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'coffeeblend_' + type + '_' + new Date().toISOString().split('T')[0] + '.csv';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
          API.showAlert('Downloaded ' + type + ' CSV report!');
        })
        .catch(function () {
          API.showAlert('Failed to export CSV report', 'error');
        });
    });
  });

  window.CoffeeBlendBM = BM;
})(window, jQuery);
