const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { generateFM00100PDF } = require('../services/pdfGenerator');
const { query } = require('../db');
const router = express.Router();

// POST /v1/pdf/fm00100/:transactionId — generate PDF for a transaction
router.post('/fm00100/:transactionId', authenticate, async (req, res) => {
  try {
    const txResult = await query(
      `SELECT t.*, ir.responses as intake_responses
       FROM transactions t
       LEFT JOIN intake_requests ir ON t.intake_id = ir.id
       WHERE t.id = $1 AND t.agency_id = $2`,
      [req.params.transactionId, req.user.agencyId]
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txResult.rows[0];
    const formData = tx.form_data || {};

    // Generate PDF
    const pdfBuffer = await generateFM00100PDF(formData);

    // Save to disk (in production: Azure Blob)
    const outputDir = path.join(__dirname, '../../generated-pdfs');
    fs.mkdirSync(outputDir, { recursive: true });
    const filename = `FM00100_${tx.id}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, pdfBuffer);

    // Update transaction record
    await query(
      `UPDATE transactions SET pdf_path = $1, pdf_generated_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [filename, tx.id]
    );

    // Stream PDF to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FM00100_${tx.id}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
});

// GET /v1/pdf/fm00100/:transactionId — download existing PDF
router.get('/fm00100/:transactionId', authenticate, async (req, res) => {
  try {
    const txResult = await query(
      `SELECT pdf_path FROM transactions WHERE id = $1 AND agency_id = $2`,
      [req.params.transactionId, req.user.agencyId]
    );

    if (txResult.rows.length === 0 || !txResult.rows[0].pdf_path) {
      return res.status(404).json({ error: 'PDF not yet generated. POST to this endpoint first.' });
    }

    const pdfPath = path.join(__dirname, '../../generated-pdfs', txResult.rows[0].pdf_path);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FM00100_${req.params.transactionId}.pdf"`);
    res.sendFile(pdfPath);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
