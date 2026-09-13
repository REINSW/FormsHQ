const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');
const { sendIntakeEmail } = require('../services/emailService');
const { sendIntakeSms } = require('../services/smsService');
const router = express.Router();

// Helper — load intake + agency, verify ownership
async function loadIntake(intakeId, agencyId) {
  const result = await query(
    `SELECT ir.*, a.name as agency_name, a.trading_as
     FROM intake_requests ir
     JOIN agencies a ON ir.agency_id = a.id
     WHERE ir.id = $1 AND ir.agency_id = $2`,
    [intakeId, agencyId]
  );
  return result.rows[0] || null;
}

function intakeUrl(intake, req) {
  const base = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host').replace('4000', '3000')}`;
  return `${base}/intake/${intake.token}`;
}

// POST /v1/notify/email
router.post('/email', authenticate, async (req, res) => {
  const { intakeId, to, toName, customMessage } = req.body;
  if (!intakeId || !to) return res.status(400).json({ error: 'intakeId and to are required' });

  try {
    const intake = await loadIntake(intakeId, req.user.agencyId);
    if (!intake) return res.status(404).json({ error: 'Intake not found' });

    const agencyName = intake.trading_as || intake.agency_name;
    const url = intakeUrl(intake, req);

    await sendIntakeEmail({
      to,
      toName: toName || intake.client_name,
      agencyName,
      propertyAddress: intake.property_address,
      intakeUrl: url,
      customMessage,
    });

    // Log delivery on intake record
    await query(
      `UPDATE intake_requests SET email_sent_at = NOW(), email_sent_to = $1 WHERE id = $2`,
      [to, intakeId]
    ).catch(() => {}); // non-fatal if column doesn't exist yet

    res.json({ sent: true, to });
  } catch (err) {
    console.error('Send email error:', err.message);
    if (err.message.includes('not configured')) {
      return res.status(503).json({ error: 'Email service not configured — add RESEND_API_KEY to .env' });
    }
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

// POST /v1/notify/sms
router.post('/sms', authenticate, async (req, res) => {
  const { intakeId, to } = req.body;
  if (!intakeId || !to) return res.status(400).json({ error: 'intakeId and to are required' });

  try {
    const intake = await loadIntake(intakeId, req.user.agencyId);
    if (!intake) return res.status(404).json({ error: 'Intake not found' });

    const agencyName = intake.trading_as || intake.agency_name;
    const url = intakeUrl(intake, req);

    const result = await sendIntakeSms({
      to,
      toName: intake.client_name,
      agencyName,
      propertyAddress: intake.property_address,
      intakeUrl: url,
    });

    // Log delivery
    await query(
      `UPDATE intake_requests SET sms_sent_at = NOW(), sms_sent_to = $1 WHERE id = $2`,
      [to, intakeId]
    ).catch(() => {});

    res.json({ sent: true, to, sid: result.sid });
  } catch (err) {
    console.error('Send SMS error:', err.message);
    if (err.message.includes('not configured')) {
      return res.status(503).json({ error: 'SMS service not configured — add Twilio credentials to .env' });
    }
    res.status(500).json({ error: err.message || 'Failed to send SMS' });
  }
});

module.exports = router;
