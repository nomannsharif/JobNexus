const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'jobseeker', phone, job_title, company_name, company_size } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existing = await db('users').where({ email: email.toLowerCase() }).first();
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [id] = await db('users').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      phone: phone || null,
      job_title: job_title || null,
      company_name: company_name || null,
      company_size: company_size || null
    });

    const user = await db('users').where({ id }).select('id', 'name', 'email', 'role', 'created_at').first();
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (user.status === 'suspended')
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });

    if (role && role !== user.role)
      return res.status(401).json({ success: false, message: `This account is registered as "${user.role}", not "${role}".` });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = generateToken(user);
    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, job_title: user.job_title, company_name: user.company_name }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'name', 'email', 'role', 'phone', 'job_title', 'company_name', 'location', 'bio', 'skills', 'created_at')
      .first();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, job_title, company_name, location, bio, skills } = req.body;
    await db('users').where({ id: req.user.id }).update({
      name: name || req.user.name,
      phone: phone || null,
      job_title: job_title || null,
      company_name: company_name || null,
      location: location || null,
      bio: bio || null,
      skills: skills ? JSON.stringify(skills) : null
    });
    return res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/auth/password ───────────────────────────────────────────────────
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

    const user = await db('users').where({ id: req.user.id }).select('password_hash').first();
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db('users').where({ id: req.user.id }).update({ password_hash });
    return res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/auth/users — Admin gets all users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const users = await db('users').select('id', 'name', 'email', 'role', 'phone', 'location', 'status', 'created_at');
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/auth/users/:id — Admin deletes a user
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    // Prevent admin from deleting themselves
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }
    const deleted = await db('users').where({ id: req.params.id }).delete();
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, message: 'User account deleted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/auth/users/:id/suspend — Admin toggles suspension status
router.patch('/users/:id/suspend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    }
    const user = await db('users').where({ id: req.params.id }).select('status').first();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await db('users').where({ id: req.params.id }).update({ status: newStatus });

    return res.json({ success: true, status: newStatus, message: `User status changed to "${newStatus}".` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
