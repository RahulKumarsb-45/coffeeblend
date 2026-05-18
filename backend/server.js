const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();




const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/menu',      require('./routes/menu'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/contact',   require('./routes/contact'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/payment',   require('./routes/payment'));

// ============================================
// SERVE FRONTEND (Catch-all)
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CoffeeBlend Server running on http://localhost:${PORT}`);
  console.log(`📁 Frontend available at http://localhost:${PORT}`);
  console.log(`🔌 API available at http://localhost:${PORT}/api\n`);
});
