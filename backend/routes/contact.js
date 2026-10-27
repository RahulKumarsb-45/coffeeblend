const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
const { protect, adminOnly } = require('../middleware/auth');

// Simple in-memory rate limiting to prevent form spam
const contactRateLimit = new Map();

// Helper: send email if SMTP credentials configured
async function sendNotificationEmail({ name, email, subject, message }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return; // SMTP not configured; stored safely in MongoDB
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"CoffeeBlend Mumbai" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Contact Inquiry] ${subject || 'New Message from ' + name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<h3>New Contact Message</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject || 'N/A'}</p><p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>`
    });
  } catch (err) {
    console.warn('Nodemailer notification warning:', err.message);
  }
}

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    // Rate limit: 1 submission per 30 seconds per IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client';
    const lastSent = contactRateLimit.get(clientIp);
    const now = Date.now();
    if (lastSent && (now - lastSent) < 25000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a moment before sending another message.'
      });
    }
    contactRateLimit.set(clientIp, now);

    const contact = await Contact.create({
      name: name.trim(),
      email: cleanEmail,
      subject: subject ? subject.trim() : 'Inquiry',
      message: message.trim()
    });

    // Send email non-blocking
    sendNotificationEmail({ name, email: cleanEmail, subject, message });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent to CoffeeBlend. We will get back to you shortly. ✉️',
      contact
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages (Admin only)
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
