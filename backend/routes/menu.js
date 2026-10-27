const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Default initial catalogue for Indian CoffeeBlend café (prices in INR ₹, using existing images)
const DEFAULT_MENU_ITEMS = [
  {
    name: 'Coffee Cappuccino',
    description: 'Rich dark espresso topped with velvety steamed milk foam and cocoa dust',
    price: 180,
    category: 'coffee',
    image: 'images/menu-1.jpg',
    isFeatured: true,
    isAvailable: true,
    customizations: {
      sizes: [{ name: 'Regular', priceExtra: 0 }, { name: 'Large', priceExtra: 40 }],
      milkOptions: ['Whole Milk', 'Oat Milk (+₹30)', 'Almond Milk (+₹30)', 'Skim Milk'],
      sugarOptions: ['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar']
    }
  },
  {
    name: 'Caramel Latte',
    description: 'Smooth espresso layered with sweet salted caramel syrup and steamed milk',
    price: 210,
    category: 'coffee',
    image: 'images/menu-2.jpg',
    isFeatured: true,
    isAvailable: true,
    customizations: {
      sizes: [{ name: 'Regular', priceExtra: 0 }, { name: 'Large', priceExtra: 40 }],
      milkOptions: ['Whole Milk', 'Oat Milk (+₹30)', 'Almond Milk (+₹30)', 'Skim Milk'],
      sugarOptions: ['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar']
    }
  },
  {
    name: 'Mocha Blend',
    description: 'Decadent espresso blended with rich dark chocolate, steamed milk and cream',
    price: 220,
    category: 'coffee',
    image: 'images/menu-3.jpg',
    isFeatured: true,
    isAvailable: true,
    customizations: {
      sizes: [{ name: 'Regular', priceExtra: 0 }, { name: 'Large', priceExtra: 40 }],
      milkOptions: ['Whole Milk', 'Oat Milk (+₹30)', 'Almond Milk (+₹30)', 'Skim Milk'],
      sugarOptions: ['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar']
    }
  },
  {
    name: 'Cold Brew Reserve',
    description: '18-hour slow steeped single-origin Chikmagalur coffee served over crystal ice',
    price: 190,
    category: 'coffee',
    image: 'images/menu-4.jpg',
    isFeatured: true,
    isAvailable: true,
    customizations: {
      sizes: [{ name: 'Regular', priceExtra: 0 }, { name: 'Large', priceExtra: 40 }],
      milkOptions: ['Black / No Milk', 'Splash of Whole Milk', 'Oat Milk (+₹30)'],
      sugarOptions: ['No Sugar', 'Normal Sugar']
    }
  },
  {
    name: 'Mumbai Masala Chai Latte',
    description: 'Freshly ground cardamom, ginger, and Assam tea leaves brewed with rich milk',
    price: 140,
    category: 'drinks',
    image: 'images/drink-1.jpg',
    isFeatured: false,
    isAvailable: true,
    customizations: {
      sizes: [{ name: 'Regular', priceExtra: 0 }, { name: 'Large', priceExtra: 30 }],
      milkOptions: ['Full Cream Milk', 'Oat Milk (+₹30)'],
      sugarOptions: ['Less Sugar', 'Normal Sugar', 'Extra Sugar']
    }
  },
  {
    name: 'Alphonso Mango Smoothie',
    description: 'Creamy Ratnagiri Alphonso mango pulp blended with Greek yogurt and wildflower honey',
    price: 180,
    category: 'drinks',
    image: 'images/drink-2.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Classic Strawberry Shake',
    description: 'Fresh Mahabaleshwar strawberries handspun with vanilla cream ice-cream',
    price: 190,
    category: 'drinks',
    image: 'images/drink-3.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Iced Americano',
    description: 'Double shot robust espresso poured over chilled mineral water and ice',
    price: 150,
    category: 'coffee',
    image: 'images/drink-4.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Belgian Chocolate Cake',
    description: 'Layers of moist dark chocolate sponge enveloped in silky 65% chocolate ganache',
    price: 190,
    category: 'desserts',
    image: 'images/dessert-1.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Classic New York Cheesecake',
    description: 'Velvety Philadelphia style baked cheesecake on a buttery graham cracker crust',
    price: 220,
    category: 'desserts',
    image: 'images/dessert-2.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Italian Tiramisu Cup',
    description: 'Espresso soaked ladyfingers layered with whipped mascarpone and dusting of cacao',
    price: 240,
    category: 'desserts',
    image: 'images/dessert-3.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Blueberry Streusel Muffin',
    description: 'Freshly baked muffin bursting with plump blueberries and butter-cinnamon crumble',
    price: 140,
    category: 'desserts',
    image: 'images/dessert-4.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Bombay Spiced Veg Burger',
    description: 'Crispy herb potato & pea patty with mint cilantro chutney, onions, and melted cheese',
    price: 170,
    category: 'burgers',
    image: 'images/burger-1.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Smoked Chicken Burger',
    description: 'Tender grilled chicken breast with smoked paprika glaze, cheddar, and garlic aioli',
    price: 230,
    category: 'burgers',
    image: 'images/burger-2.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Tandoori Paneer Panini',
    description: 'Chargrilled marinated cottage cheese with bell peppers toasted in artisan sourdough',
    price: 200,
    category: 'dishes',
    image: 'images/dish-1.jpg',
    isFeatured: false,
    isAvailable: true
  },
  {
    name: 'Penne Arrabiata',
    description: 'Al dente penne pasta tossed in fiery San Marzano tomato, garlic, and fresh basil sauce',
    price: 250,
    category: 'dishes',
    image: 'images/dish-2.jpg',
    isFeatured: false,
    isAvailable: true
  }
];

// Helper: Seed default products if collection is completely empty
async function ensureProductsPopulated() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(DEFAULT_MENU_ITEMS);
      console.log('✅ Initial CoffeeBlend products catalogue seeded in INR.');
    }
  } catch (err) {
    console.error('Error checking product catalogue:', err.message);
  }
}

// Initial check on module load
ensureProductsPopulated();

// @route   GET /api/menu
// @desc    Get all menu items (with search, category filter, availability)
// @access  Public
router.get('/', async (req, res) => {
  try {
    await ensureProductsPopulated();

    const query = {};

    // Availability filter (non-admin requests only see available items by default)
    if (req.query.includeUnavailable !== 'true') {
      query.isAvailable = true;
    }

    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category.toLowerCase().trim();
    }

    // Search filter
    if (req.query.q || req.query.search) {
      const term = (req.query.q || req.query.search).trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, count: products.length, products, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/menu/featured
// @desc    Get featured products (for homepage)
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    await ensureProductsPopulated();
    const products = await Product.find({ isAvailable: true, isFeatured: true }).limit(8);
    res.json({ success: true, count: products.length, products, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/menu/categories
// @desc    Get all available categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isAvailable: true });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/menu/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product, currency: 'INR', symbol: '₹' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// AUTHORIZED MANAGEMENT OPERATIONS (Admin Only)
// ============================================

// @route   POST /api/menu
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update product details (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/menu/:id/availability
// @desc    Toggle product availability (Admin only)
// @access  Private/Admin
router.patch('/:id/availability', protect, adminOnly, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : !product.isAvailable;
    await product.save();

    res.json({
      success: true,
      message: `Product is now ${product.isAvailable ? 'available' : 'unavailable'}`,
      product
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product removed safely' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
