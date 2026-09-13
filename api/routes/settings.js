const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /v1/settings/agency — get the agency profile
router.get('/agency', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, trading_as, licence_no, abn,
              address, suburb, state, postcode,
              phone_work, phone_mobile, email, website,
              trust_bank_name, trust_account_name, trust_bsb, trust_account_no,
              default_management_fee_pct, default_letting_fee,
              default_admin_fee, default_repairs_limit,
              default_lease_renewal_fee, default_tribunal_fee
       FROM agencies WHERE id = $1`,
      [req.user.agencyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agency not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/settings/agency — update agency profile
router.patch('/agency', authenticate, async (req, res) => {
  const {
    name, trading_as, licence_no, abn,
    address, suburb, state, postcode,
    phone_work, phone_mobile, email, website,
    trust_bank_name, trust_account_name, trust_bsb, trust_account_no,
    default_management_fee_pct, default_letting_fee,
    default_admin_fee, default_repairs_limit,
    default_lease_renewal_fee, default_tribunal_fee,
  } = req.body;

  try {
    const result = await query(
      `UPDATE agencies SET
        name = COALESCE($1, name),
        trading_as = COALESCE($2, trading_as),
        licence_no = COALESCE($3, licence_no),
        abn = COALESCE($4, abn),
        address = COALESCE($5, address),
        suburb = COALESCE($6, suburb),
        state = COALESCE($7, state),
        postcode = COALESCE($8, postcode),
        phone_work = COALESCE($9, phone_work),
        phone_mobile = COALESCE($10, phone_mobile),
        email = COALESCE($11, email),
        website = COALESCE($12, website),
        trust_bank_name = COALESCE($13, trust_bank_name),
        trust_account_name = COALESCE($14, trust_account_name),
        trust_bsb = COALESCE($15, trust_bsb),
        trust_account_no = COALESCE($16, trust_account_no),
        default_management_fee_pct = COALESCE($17, default_management_fee_pct),
        default_letting_fee = COALESCE($18, default_letting_fee),
        default_admin_fee = COALESCE($19, default_admin_fee),
        default_repairs_limit = COALESCE($20, default_repairs_limit),
        default_lease_renewal_fee = COALESCE($21, default_lease_renewal_fee),
        default_tribunal_fee = COALESCE($22, default_tribunal_fee),
        updated_at = NOW()
       WHERE id = $23
       RETURNING *`,
      [
        name, trading_as, licence_no, abn,
        address, suburb, state, postcode,
        phone_work, phone_mobile, email, website,
        trust_bank_name, trust_account_name, trust_bsb, trust_account_no,
        default_management_fee_pct, default_letting_fee,
        default_admin_fee, default_repairs_limit,
        default_lease_renewal_fee, default_tribunal_fee,
        req.user.agencyId,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/settings/agent — get the logged-in agent's profile
router.get('/agent', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
