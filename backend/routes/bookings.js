const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const jwt     = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

function extractUserId(req) {
  try {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) {
      const d = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
      return d.id;
    }
  } catch(e) {}
  return null;
}

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, date, time, phone, guests, message } = req.body;
    if (!firstName || !lastName || !date || !time || !phone)
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    const booking = await Booking.create({
      user: extractUserId(req),
      firstName, lastName, date, time,
      phone, guests: guests || 2, message
    });
    res.status(201).json({ success: true, message: "Table booked! We'll confirm soon. ☕", booking });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/my-bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: bookings.length, bookings });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
