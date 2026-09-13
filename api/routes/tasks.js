const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /v1/tasks?transactionId=xxx
router.get('/', authenticate, async (req, res) => {
  const { transactionId } = req.query;
  if (!transactionId) return res.status(400).json({ error: 'transactionId required' });
  try {
    const result = await query(
      `SELECT t.*, u.full_name as completed_by_name
       FROM tasks t
       LEFT JOIN users u ON t.completed_by = u.id
       WHERE t.transaction_id = $1 AND t.agency_id = $2
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         t.created_at ASC`,
      [transactionId, req.user.agencyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/tasks — create a custom task
router.post('/', authenticate, async (req, res) => {
  const { transactionId, title, description, category, priority, due_date } = req.body;
  if (!transactionId || !title) return res.status(400).json({ error: 'transactionId and title required' });
  try {
    const result = await query(
      `INSERT INTO tasks (transaction_id, agency_id, title, description, category, priority, due_date, is_auto_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [transactionId, req.user.agencyId, title, description || null,
       category || 'admin', priority || 'normal', due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/tasks/:id
router.patch('/:id', authenticate, async (req, res) => {
  const { status, notes, due_date, priority, title } = req.body;
  const updates = [];
  const values = [];
  let idx = 1;

  if (status !== undefined) {
    updates.push(`status = $${idx++}`);
    values.push(status);
    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
      updates.push(`completed_by = $${idx++}`);
      values.push(req.user.userId);
    } else {
      updates.push(`completed_at = NULL`);
      updates.push(`completed_by = NULL`);
    }
  }
  if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes); }
  if (due_date !== undefined) { updates.push(`due_date = $${idx++}`); values.push(due_date || null); }
  if (priority !== undefined) { updates.push(`priority = $${idx++}`); values.push(priority); }
  if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  updates.push(`updated_at = NOW()`);
  values.push(req.params.id, req.user.agencyId);

  try {
    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE id = $${idx++} AND agency_id = $${idx++}
       RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /v1/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query(
      `DELETE FROM tasks WHERE id = $1 AND agency_id = $2 AND is_auto_generated = false`,
      [req.params.id, req.user.agencyId]
    );
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
