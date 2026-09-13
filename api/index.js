require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const intakeRoutes = require('./routes/intake');
const transactionRoutes = require('./routes/transactions');
const formioRoutes = require('./routes/formio');
const pdfRoutes = require('./routes/pdf');
const taskRoutes = require('./routes/tasks');
const voiceRoutes = require('./routes/voice');
const notifyRoutes = require('./routes/notify');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'REI Forms API', version: '1.0.0' }));

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/intake', intakeRoutes);
app.use('/v1/transactions', transactionRoutes);
app.use('/v1/formio', formioRoutes);
app.use('/v1/pdf', pdfRoutes);
app.use('/v1/tasks', taskRoutes);
app.use('/v1/voice', voiceRoutes);
app.use('/v1/notify', notifyRoutes);
app.use('/v1/settings', settingsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`REI Forms API running on http://localhost:${PORT}`));
