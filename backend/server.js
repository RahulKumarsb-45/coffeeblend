const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header, such as curl or server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow local frontend development servers.
    if (
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    // In production, allow only explicitly configured frontend origins.
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '1mb'
}));

// Serve frontend static files.
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/products', require('./routes/products'));
app.use('/api/payment', require('./routes/payment'));

app.use('/api/inventory', require('./routes/inventory').router);
app.use('/api/coupons', require('./routes/coupons').router);
app.use('/api/loyalty', require('./routes/loyalty').router);

app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/management', require('./routes/management'));

// ============================================
// API 404 HANDLER
// ============================================

app.all('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// ============================================
// FRONTEND FALLBACK
// ============================================

app.get('*', (req, res, next) => {
  res.sendFile(
    path.join(__dirname, '../frontend/index.html'),
    (err) => {
      if (err) {
        next(err);
      }
    }
  );
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed'
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request body'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body too large'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ============================================
// START SERVER AFTER DATABASE CONNECTION
// ============================================

const PORT = process.env.PORT || 5000;

let server;

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Server cannot start.');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully');

    server = app.listen(PORT, () => {
      console.log(`CoffeeBlend server running on port ${PORT}`);
      console.log(`API base path: /api`);
    });

    server.on('error', (err) => {
      console.error('HTTP server error:', err.message);
      process.exitCode = 1;
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exitCode = 1;
  }
}

// Export the app for testing; start the server only when run directly.
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  get server() {
    return server;
  }
};
