const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// POST /v1/intake — agent creates a new intake request
router.post('/', authenticate, async (req, res) => {
  const { clientName, clientEmail, clientMobile, propertyAddress } = req.body;
  const { agencyId, userId } = req.user;

  const token = uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    const result = await query(
      `INSERT INTO intake_requests
        (agency_id, created_by, token, token_expires_at, status, client_name, client_email, client_mobile, property_address)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
       RETURNING *`,
      [agencyId, userId, token, expiresAt, clientName, clientEmail, clientMobile, propertyAddress]
    );

    const intake = result.rows[0];
    const intakeUrl = `${process.env.FRONTEND_URL}/intake/${token}`;

    res.status(201).json({
      id: intake.id,
      token,
      intakeUrl,
      expiresAt,
      status: 'pending',
      clientName: intake.client_name,
      clientEmail: intake.client_email,
      clientMobile: intake.client_mobile,
      propertyAddress: intake.property_address,
    });
  } catch (err) {
    console.error('Create intake error:', err);
    res.status(500).json({ error: 'Failed to create intake request' });
  }
});

// GET /v1/intake — list all intake requests for the agency
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT ir.*, u.full_name as created_by_name,
              t.id as transaction_id, t.status as transaction_status
       FROM intake_requests ir
       LEFT JOIN users u ON ir.created_by = u.id
       LEFT JOIN LATERAL (
         SELECT id, status FROM transactions
         WHERE intake_id = ir.id AND status NOT IN ('cancelled','archived')
         ORDER BY created_at DESC LIMIT 1
       ) t ON true
       WHERE ir.agency_id = $1
       ORDER BY ir.created_at DESC
       LIMIT 100`,
      [req.user.agencyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /v1/intake error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /v1/intake/:token — public route for client intake form
router.get('/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT ir.*, a.name as agency_name, a.trading_as, a.email as agency_email
       FROM intake_requests ir
       JOIN agencies a ON ir.agency_id = a.id
       WHERE ir.token = $1`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intake request not found' });
    }

    const intake = result.rows[0];

    if (intake.status === 'submitted') {
      return res.status(410).json({ error: 'This form has already been submitted' });
    }

    if (new Date(intake.token_expires_at) < new Date()) {
      return res.status(410).json({ error: 'This intake link has expired' });
    }

    res.json({
      id: intake.id,
      status: intake.status,
      agencyName: intake.trading_as || intake.agency_name,
      clientName: intake.client_name,
      propertyAddress: intake.property_address,
      formioBaseUrl: process.env.FORMIO_BASE_URL
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/intake/:token/submit — client submits the intake form
router.post('/:token/submit', async (req, res) => {
  const { responses, formioSubmissionId } = req.body;

  try {
    const result = await query(
      `UPDATE intake_requests
       SET status = 'submitted', responses = $1, formio_submission_id = $2, submitted_at = NOW(), updated_at = NOW()
       WHERE token = $3 AND status = 'pending'
       RETURNING *`,
      [JSON.stringify(responses), formioSubmissionId, req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Intake not found or already submitted' });
    }

    res.json({ success: true, message: 'Intake submitted successfully' });
  } catch (err) {
    console.error('Submit intake error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
