const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { buildFM00100Prefill } = require('../services/prefill');
const { generateTasks } = require('../services/taskTemplates');
const { createSubmission, buildWizardUrl, FORMIO_BASE } = require('../services/formio');
const router = express.Router();

// POST /v1/transactions — start a new MA from an intake
router.post('/', authenticate, async (req, res) => {
  const { intakeId } = req.body;
  const { agencyId, userId } = req.user;

  try {
    // 1. Load intake + agency
    const intakeResult = await query(
      `SELECT ir.*, a.*
       FROM intake_requests ir
       JOIN agencies a ON ir.agency_id = a.id
       WHERE ir.id = $1 AND ir.agency_id = $2`,
      [intakeId, agencyId]
    );

    if (intakeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Intake not found' });
    }

    const intake = intakeResult.rows[0];
    if (intake.status !== 'submitted') {
      return res.status(400).json({ error: 'Intake has not been submitted yet' });
    }

    // 2. Build pre-fill payload
    const agencyProfile = {
      id: intake.agency_id,
      name: intake.name,
      trading_as: intake.trading_as,
      licence_no: intake.licence_no,
      abn: intake.abn,
      address: intake.address,
      suburb: intake.suburb,
      state: intake.state,
      postcode: intake.postcode,
      phone_work: intake.phone_work,
      email: intake.email,
      trust_bank_name:    intake.trust_bank_name,
      trust_account_name: intake.trust_account_name,
      trust_bsb:          intake.trust_bsb,
      trust_account_no:   intake.trust_account_no,
      default_management_fee_pct:  intake.default_management_fee_pct,
      default_letting_fee:         intake.default_letting_fee,
      default_admin_fee:           intake.default_admin_fee,
      default_repairs_limit:       intake.default_repairs_limit,
      default_lease_renewal_fee:   intake.default_lease_renewal_fee,
      default_tribunal_fee:        intake.default_tribunal_fee
    };

    const prefillData = buildFM00100Prefill(intake.responses || {}, agencyProfile);

    // 3. Create Form.io submission with pre-fill data
    let formioSubmissionId = null;
    let wizardUrl = null;
    try {
      const submission = await createSubmission('wizard/fm00100', prefillData);
      formioSubmissionId = submission._id;
      wizardUrl = `${FORMIO_BASE}/wizard/fm00100?submission=${formioSubmissionId}`;
    } catch (formioErr) {
      console.warn('Form.io submission failed, continuing without it:', formioErr.message);
      // Still create transaction — wizard URL will be base form URL
      wizardUrl = `${FORMIO_BASE}/wizard/fm00100`;
    }

    // 4. Generate prefill token for API-based pre-fill
    const prefillToken = uuidv4().replace(/-/g, '');
    const prefillExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 5. Create transaction record
    const txResult = await query(
      `INSERT INTO transactions
        (agency_id, created_by, intake_id, form_id, form_name, transaction_type,
         status, formio_submission_id, prefill_token, prefill_token_expires_at, form_data)
       VALUES ($1, $2, $3, 'FM00100', 'Exclusive Management Agency Agreement (Residential)', 'management_authority',
               'in_progress', $4, $5, $6, $7)
       RETURNING *`,
      [agencyId, userId, intakeId, formioSubmissionId, prefillToken, prefillExpires, JSON.stringify(prefillData)]
    );

    const tx = txResult.rows[0];

    // 6. Auto-generate tasks
    try {
      const tasks = generateTasks(tx.id, agencyId, prefillData, intake.responses || {});
      if (tasks.length > 0) {
        const placeholders = tasks.map((_, i) => {
          const base = i * 8;
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
        }).join(',');
        const values = tasks.flatMap(t => [
          t.transaction_id, t.agency_id, t.title, t.description,
          t.category, t.priority, t.status, t.is_auto_generated
        ]);
        await query(
          `INSERT INTO tasks (transaction_id,agency_id,title,description,category,priority,status,is_auto_generated) VALUES ${placeholders}`,
          values
        );
      }
    } catch (taskErr) {
      console.warn('Task generation failed, continuing:', taskErr.message);
    }

    res.status(201).json({
      id: tx.id,
      formId: 'FM00100',
      formName: tx.form_name,
      status: tx.status,
      prefillToken,
      wizardUrl,
      prefillData,
      createdAt: tx.created_at
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to start transaction' });
  }
});

// GET /v1/transactions — list transactions for agency
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, 
              ir.client_name, ir.client_email, ir.property_address,
              ir.status as intake_status,
              u.full_name as created_by_name
       FROM transactions t
       LEFT JOIN intake_requests ir ON t.intake_id = ir.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.agency_id = $1
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [req.user.agencyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/transactions/check-duplicate — must be before /:id to avoid route conflict
router.get('/check-duplicate', authenticate, async (req, res) => {
  const { propertyAddress } = req.query;
  if (!propertyAddress) return res.json({ duplicates: [] });
  try {
    const result = await query(
      `SELECT t.id, t.status, t.created_at, ir.client_name, ir.property_address
       FROM transactions t
       LEFT JOIN intake_requests ir ON t.intake_id = ir.id
       WHERE t.agency_id = $1
         AND t.status NOT IN ('cancelled', 'archived')
         AND LOWER(ir.property_address) = LOWER($2)`,
      [req.user.agencyId, propertyAddress]
    );
    res.json({ duplicates: result.rows });
  } catch (err) {
    res.json({ duplicates: [] });
  }
});

// GET /v1/transactions/:id — get single transaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, ir.client_name, ir.client_email, ir.property_address, ir.responses as intake_responses
       FROM transactions t
       LEFT JOIN intake_requests ir ON t.intake_id = ir.id
       WHERE t.id = $1 AND t.agency_id = $2`,
      [req.params.id, req.user.agencyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/transactions/prefill/:token — get pre-fill data by token (used by Form.io)
router.get('/prefill/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.form_data FROM transactions t
       WHERE t.prefill_token = $1 AND t.prefill_token_expires_at > NOW()`,
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Token not found or expired' });
    res.json(result.rows[0].form_data || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/transactions/:id/status — change status
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'in_progress', 'completed', 'cancelled', 'archived'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await query(
      `UPDATE transactions SET status = $1, updated_at = NOW()
       WHERE id = $2 AND agency_id = $3 RETURNING *`,
      [status, req.params.id, req.user.agencyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /v1/transactions/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM transactions WHERE id = $1 AND agency_id = $2 RETURNING id`,
      [req.params.id, req.user.agencyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/transactions/:id/duplicate — copy a transaction
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const src = await query(
      `SELECT * FROM transactions WHERE id = $1 AND agency_id = $2`,
      [req.params.id, req.user.agencyId]
    );
    if (src.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const t = src.rows[0];
    const prefillToken = uuidv4().replace(/-/g, '');
    const result = await query(
      `INSERT INTO transactions
        (agency_id, created_by, intake_id, form_id, form_name, transaction_type,
         status, form_data, prefill_token, prefill_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9)
       RETURNING *`,
      [t.agency_id, req.user.userId, t.intake_id, t.form_id, t.form_name,
       t.transaction_type, t.form_data,
       prefillToken, new Date(Date.now() + 48 * 60 * 60 * 1000)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/transactions/:id/complete — mark as completed after wizard submission
// POST /v1/transactions/:id/generate-tasks — retroactively generate tasks for an existing transaction
router.post('/:id/generate-tasks', authenticate, async (req, res) => {
  const { agencyId } = req.user;
  try {
    // Load transaction + its intake
    const txResult = await query(
      `SELECT t.*, ir.responses as intake_responses, a.*
       FROM transactions t
       LEFT JOIN intake_requests ir ON t.intake_id = ir.id
       JOIN agencies a ON t.agency_id = a.id
       WHERE t.id = $1 AND t.agency_id = $2`,
      [req.params.id, agencyId]
    );
    if (txResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const tx = txResult.rows[0];

    // Check no tasks exist yet
    const existing = await query(
      `SELECT COUNT(*) FROM tasks WHERE transaction_id = $1`,
      [req.params.id]
    );
    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Tasks already exist for this transaction' });
    }

    const prefillData = tx.form_data || {};
    const intakeResponses = tx.intake_responses || {};
    const tasks = generateTasks(req.params.id, agencyId, prefillData, intakeResponses);

    if (tasks.length === 0) return res.json({ inserted: 0 });

    const placeholders = tasks.map((_, i) => {
      const base = i * 8;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
    }).join(',');
    const values = tasks.flatMap(t => [
      t.transaction_id, t.agency_id, t.title, t.description,
      t.category, t.priority, t.status, t.is_auto_generated
    ]);
    await query(
      `INSERT INTO tasks (transaction_id,agency_id,title,description,category,priority,status,is_auto_generated) VALUES ${placeholders}`,
      values
    );
    res.json({ inserted: tasks.length });
  } catch (err) {
    console.error('Generate tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/complete', authenticate, async (req, res) => {
  const { formData, formioSubmissionId } = req.body;
  try {
    const result = await query(
      `UPDATE transactions
       SET status = 'completed', form_data = $1, formio_submission_id = COALESCE($2, formio_submission_id),
           completed_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND agency_id = $4
       RETURNING *`,
      [JSON.stringify(formData), formioSubmissionId, req.params.id, req.user.agencyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Complete transaction error:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
