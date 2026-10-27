
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

/* Sign JWT */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, address, city, pincode } = req.body;

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid username, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: cleanUsername }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.email === cleanEmail
            ? 'Email already registered'
            : 'Username already taken'
      });
    }

    // Public registration must never grant admin privileges.
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'user',
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: typeof address === 'string' ? address.trim() : '',
      city: typeof city === 'string' && city.trim() ? city.trim() : 'Mumbai',
      pincode: typeof pincode === 'string' ? pincode.trim() : ''
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        pincode: user.pincode
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    console.error('Registration error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and password are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Never promote users during login.
    const token = signToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || 'Mumbai',
        pincode: user.pincode || ''
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/* GET /api/auth/me */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve profile'
    });
  }
});

/* PUT /api/auth/profile */
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, phone, address, city, pincode } = req.body;
    const updates = {};

    if (username !== undefined) {
      if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Username must be a non-empty string'
        });
      }

      const cleanUsername = username.trim();

      if (cleanUsername !== req.user.username) {
        const exists = await User.findOne({
          username: cleanUsername,
          _id: { $ne: req.user._id }
        });

        if (exists) {
          return res.status(400).json({
            success: false,
            message: 'Username already in use'
          });
        }

        updates.username = cleanUsername;
      }
    }

    for (const [field, value] of Object.entries({
      phone, address, city, pincode
    })) {
      if (value !== undefined) {
        if (typeof value !== 'string') {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`
          });
        }

        updates[field] = value.trim();
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Username already in use'
      });
    }

    console.error('Profile update error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
});

/* GET /api/auth/admins — admin only */
router.get('/admins', protect, adminOnly, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');

    return res.json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (err) {
    console.error('List admins error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve admins'
    });
  }
});

/* POST /api/auth/create-admin — admin only */
router.post('/create-admin', protect, adminOnly, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !email.trim() ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid username, email and password are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const existing = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: cleanUsername }
      ]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    console.error('Create admin error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to create admin'
    });
  }
});

/* DELETE /api/auth/admins/:id — admin only */
router.delete('/admins/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    const deletedAdmin = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'admin'
    });

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      message: 'Admin deleted'
    });
  } catch (err) {
    console.error('Delete admin error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete admin'
    });
  }
});

module.exports = router;
