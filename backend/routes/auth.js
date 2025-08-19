import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// User Login
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (non-admin only)
    const user = await User.findOne({ email, isActive: true, role: 'user' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin user only
    const user = await User.findOne({ email, isActive: true, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate admin token with different secret
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: '24h' } // Shorter expiry for admin tokens
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user (for regular users)
router.get('/user/me', authenticateUser, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Get current admin (for admin users)
router.get('/admin/me', authenticateAdmin, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;