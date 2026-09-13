const express = require('express');
const { authenticate } = require('../middleware/auth');
const { extractFields } = require('../services/voiceExtract');
const router = express.Router();

// POST /v1/voice/extract
// Body: { transcript: string, context: string }
router.post('/extract', authenticate, async (req, res) => {
  const { transcript, context } = req.body;
  if (!transcript || transcript.trim().length < 5) {
    return res.status(400).json({ error: 'Transcript is too short' });
  }
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured', fields: {} });
  }
  try {
    const fields = await extractFields(transcript.trim(), context || 'intake');
    res.json({ fields });
  } catch (err) {
    console.error('Voice extract error:', err.message);
    res.status(500).json({ error: 'Failed to extract fields: ' + err.message });
  }
});

module.exports = router;
