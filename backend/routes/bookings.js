const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const jwt     = require('jsonwebtoken');
const { protect, adminOnly } = require('../middleware/auth');
const { OPERATING_HOURS, isWithinOperatingHours } = require('../config/cafe');

// Helper: extract optional userId from token without failing if guest
function extractUserId(req) {
  try {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) {
      const d = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
      return d.id;
    }
  } catch (e) {}
  return null;
}

// ============================================
// POST /api/bookings
// Book a table (Guest or Logged in user)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, name, email, date, time, phone, guests = 2, message, preOrderItems } = req.body;

    let fName = (firstName || '').trim();
    let lName = (lastName || '').trim();
    if (!fName && name) {
      const parts = name.trim().split(/\s+/);
      fName = parts[0] || 'Guest';
      lName = parts.slice(1).join(' ') || parts[0] || 'Customer';
    }
    if (!lName && fName) lName = fName;

    if (!fName || !date || !time || !phone) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields: name, date, time, and phone.' });
    }

    const guestCount = Math.max(1, Math.min(20, parseInt(guests, 10) || 2));

    // Capacity & conflict detection: check existing bookings for this date and time slot
    const existingBookings = await Booking.find({
      date: date.trim(),
      time: time.trim(),
      status: { $in: ['pending', 'confirmed'] }
    });

    const totalGuestsBooked = existingBookings.reduce((sum, b) => sum + (b.guests || 2), 0);
    const MAX_CAPACITY_PER_SLOT = parseInt(process.env.MAX_TABLE_CAPACITY_PER_SLOT || '30', 10);

    if (totalGuestsBooked + guestCount > MAX_CAPACITY_PER_SLOT) {
      return res.status(400).json({
        success: false,
        message: `Sorry, this time slot is fully booked (${totalGuestsBooked}/${MAX_CAPACITY_PER_SLOT} seats reserved). Please choose another time.`
      });
    }

    const userId = extractUserId(req);

    const booking = await Booking.create({
      user: userId,
      firstName: fName,
      lastName: lName,
      email: email ? email.trim() : '',
      date: date.trim(),
      time: time.trim(),
      phone: phone.trim(),
      guests: guestCount,
      message: message ? message.trim() : '',
      preOrderItems: Array.isArray(preOrderItems) ? preOrderItems : [],
      status: 'confirmed' // Auto-confirm reservation when capacity is available
    });

    res.status(201).json({
      success: true,
      message: `Table confirmed for ${guestCount} guests on ${date} at ${time}! ☕`,
      booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// GET /api/bookings/my-bookings
// Get authenticated customer's booking history
// ============================================
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// PUT /api/bookings/:id/cancel
// Customer cancel booking
// ============================================
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.user && booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason || 'Cancelled by customer';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// AUTHORIZED MANAGEMENT OPERATIONS (Admin Only)
// ============================================

// @route   GET /api/bookings/admin/all
// @desc    Get all table reservations across all customers (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'username email').sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (confirmed / cancelled) (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, message: `Booking status updated to "${status}"`, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
