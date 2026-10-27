const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect, adminOnly } = require('../middleware/auth');

// Default initial café inventory items
const DEFAULT_INVENTORY = [
  { name: 'Estate Arabica Beans', category: 'beans', unit: 'kg', stockQuantity: 25, minThreshold: 5, costPerUnit: 850 },
  { name: 'House Espresso Blend', category: 'beans', unit: 'kg', stockQuantity: 30, minThreshold: 8, costPerUnit: 780 },
  { name: 'Standard Dairy Milk', category: 'dairy', unit: 'litres', stockQuantity: 45, minThreshold: 10, costPerUnit: 70 },
  { name: 'Almond Milk (Unsweetened)', category: 'dairy', unit: 'litres', stockQuantity: 15, minThreshold: 4, costPerUnit: 220 },
  { name: 'Oat Milk (Barista Edition)', category: 'dairy', unit: 'litres', stockQuantity: 18, minThreshold: 4, costPerUnit: 260 },
  { name: 'Vanilla Bean Syrup', category: 'syrups', unit: 'ml', stockQuantity: 4500, minThreshold: 1000, costPerUnit: 0.8 },
  { name: 'Hazelnut Syrup', category: 'syrups', unit: 'ml', stockQuantity: 3800, minThreshold: 1000, costPerUnit: 0.8 },
  { name: 'Natural Cane Sugar', category: 'syrups', unit: 'kg', stockQuantity: 20, minThreshold: 5, costPerUnit: 55 },
  { name: '12oz Hot Cups & Lids', category: 'packaging', unit: 'units', stockQuantity: 350, minThreshold: 60, costPerUnit: 6 },
  { name: '16oz Cold Beverage Cups', category: 'packaging', unit: 'units', stockQuantity: 280, minThreshold: 50, costPerUnit: 7 },
  { name: 'Butter Croissants (Fresh)', category: 'bakery', unit: 'pieces', stockQuantity: 24, minThreshold: 5, costPerUnit: 65 },
  { name: 'Double Chocolate Muffins', category: 'bakery', unit: 'pieces', stockQuantity: 20, minThreshold: 5, costPerUnit: 70 }
];

async function seedDefaultInventoryIfEmpty() {
  try {
    const count = await Inventory.countDocuments();
    if (count === 0) {
      await Inventory.insertMany(DEFAULT_INVENTORY);
      console.log('✅ Default café inventory items initialized successfully');
    }
  } catch (err) {
    console.warn('Inventory seed notice:', err.message);
  }
}
seedDefaultInventoryIfEmpty();

/* ── Helper: Deduct stock when order is confirmed ── */
async function deductOrderStock(order) {
  if (!order || order.inventoryDeducted) return;
  try {
    const totalItems = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

    // Approximate operational ingredient deductions per cup/item
    const beanUsageKg = Math.round(totalItems * 0.02 * 100) / 100; // ~20g per coffee
    const milkUsageLitres = Math.round(totalItems * 0.18 * 100) / 100; // ~180ml milk

    // Deduct Espresso Blend
    await Inventory.findOneAndUpdate(
      { name: 'House Espresso Blend', stockQuantity: { $gte: beanUsageKg } },
      {
        $inc: { stockQuantity: -beanUsageKg },
        $push: { movementHistory: { change: -beanUsageKg, reason: 'order_deduction', orderId: order._id, updatedBy: 'system' } }
      }
    );

    // Deduct Milk
    await Inventory.findOneAndUpdate(
      { name: 'Standard Dairy Milk', stockQuantity: { $gte: milkUsageLitres } },
      {
        $inc: { stockQuantity: -milkUsageLitres },
        $push: { movementHistory: { change: -milkUsageLitres, reason: 'order_deduction', orderId: order._id, updatedBy: 'system' } }
      }
    );

    // Deduct Packaging if delivery or pickup
    if (order.fulfilmentType !== 'dine_in') {
      await Inventory.findOneAndUpdate(
        { name: '12oz Hot Cups & Lids', stockQuantity: { $gte: totalItems } },
        {
          $inc: { stockQuantity: -totalItems },
          $push: { movementHistory: { change: -totalItems, reason: 'order_deduction', orderId: order._id, updatedBy: 'system' } }
        }
      );
    }

    order.inventoryDeducted = true;
    await order.save();
  } catch (e) {
    console.error('Inventory deduction error:', e.message);
  }
}

/* ── Helper: Restore stock if order was cancelled after deduction ── */
async function restoreOrderStock(order) {
  if (!order || !order.inventoryDeducted) return;
  try {
    const totalItems = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
    const beanUsageKg = Math.round(totalItems * 0.02 * 100) / 100;
    const milkUsageLitres = Math.round(totalItems * 0.18 * 100) / 100;

    await Inventory.findOneAndUpdate(
      { name: 'House Espresso Blend' },
      {
        $inc: { stockQuantity: beanUsageKg },
        $push: { movementHistory: { change: beanUsageKg, reason: 'order_cancellation_restore', orderId: order._id, updatedBy: 'system' } }
      }
    );

    await Inventory.findOneAndUpdate(
      { name: 'Standard Dairy Milk' },
      {
        $inc: { stockQuantity: milkUsageLitres },
        $push: { movementHistory: { change: milkUsageLitres, reason: 'order_cancellation_restore', orderId: order._id, updatedBy: 'system' } }
      }
    );

    order.inventoryDeducted = false;
    await order.save();
  } catch (e) {
    console.error('Inventory restore error:', e.message);
  }
}

/* ── GET /api/inventory (Admin only) ── */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const items = await Inventory.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: items.length, inventory: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/inventory/alerts (Admin only) ── */
router.get('/alerts', protect, adminOnly, async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$stockQuantity', '$minThreshold'] }
    }).sort({ stockQuantity: 1 });

    res.json({
      success: true,
      count: items.length,
      alerts: items.map(i => ({
        id: i._id,
        name: i.name,
        category: i.category,
        currentStock: i.stockQuantity,
        minThreshold: i.minThreshold,
        unit: i.unit,
        severity: i.stockQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/inventory (Admin only) ── */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, category, unit, stockQuantity = 0, minThreshold = 5, costPerUnit = 0 } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'Name and unit are required.' });
    }

    const item = await Inventory.create({
      name: name.trim(),
      category: category || 'other',
      unit,
      stockQuantity: parseFloat(stockQuantity) || 0,
      minThreshold: parseFloat(minThreshold) || 5,
      costPerUnit: parseFloat(costPerUnit) || 0,
      movementHistory: [{ change: parseFloat(stockQuantity) || 0, reason: 'initial_stock', updatedBy: req.user.username }]
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/inventory/:id/adjust (Admin only) ── */
router.put('/:id/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { change, reason = 'manual_adjustment' } = req.body;
    const delta = parseFloat(change);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'Valid non-zero change quantity required.' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    if (item.stockQuantity + delta < 0) {
      return res.status(400).json({ success: false, message: `Cannot reduce stock below 0. Current stock is ${item.stockQuantity} ${item.unit}.` });
    }

    item.stockQuantity = Math.round((item.stockQuantity + delta) * 100) / 100;
    if (delta > 0) item.lastRestocked = new Date();

    item.movementHistory.push({
      change: delta,
      reason,
      updatedBy: req.user.username
    });

    await item.save();
    res.json({ success: true, message: `Stock adjusted. Current: ${item.stockQuantity} ${item.unit}`, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = {
  router,
  deductOrderStock,
  restoreOrderStock
};
