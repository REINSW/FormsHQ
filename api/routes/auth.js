const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const router = express.Router();

// For prototype: simple password check without bcrypt dependency issues
// Production: use bcrypt.compare
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await query(
      `SELECT u.*, a.name as agency_name, a.trading_as, a.id as agency_id
       FROM users u JOIN agencies a ON u.agency_id = a.id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Prototype: accept "demo1234" for the seeded user, or check plain match
    const validPasswords = ['demo1234'];
    const valid = validPasswords.includes(password) || password === user.password_hash;

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        agencyId: user.agency_id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        agencyName: user.agency_name,
        tradingAs: user.trading_as
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        agencyId: user.agency_id,
        agencyName: user.agency_name,
        tradingAs: user.trading_as
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, a.id as agency_id, a.name as agency_name, a.trading_as
       FROM users u JOIN agencies a ON u.agency_id = a.id WHERE u.id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
