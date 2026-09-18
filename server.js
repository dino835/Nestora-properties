require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { attachUser } = require('./src/middleware/auth');
const authRoutes = require('./src/routes/auth');
const propertyRoutes = require('./src/routes/properties');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/upload');
const leadRoutes = require('./src/routes/leads');
const agentRoutes = require('./src/routes/agents');

// Seed demo data on first run (no-op if data already exists)
require('./src/seed');

const app = express();
const PORT = process.env.PORT || 4000;

// Same read-only-filesystem constraint as db.js/upload.js: on Vercel only
// /tmp is writable, so that's where uploaded photos actually land.
const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/nestora-uploads'
  : path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(attachUser); // populates req.user from a Bearer token, if present

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/agents', agentRoutes);

// ── Serve the frontend (public/index.html + any static assets) ──
app.use(express.static(path.join(__dirname, 'public')));

// API 404s stay as JSON; anything else falls back to the single-page app
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong.' });
});

// On Vercel, this file is required by api/index.js and exported as a
// serverless function handler — Vercel calls it per-request, so it must
// NOT also open its own listening socket. Everywhere else (local dev,
// Render, Railway, etc.) it runs as a normal always-on Node server.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Nestora Properties running at http://localhost:${PORT}`);
  });
}

module.exports = app;
