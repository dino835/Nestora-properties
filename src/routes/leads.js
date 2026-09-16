const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── PUBLIC: anyone (no account needed) can ask Nestora Properties to sell for them ──
router.post('/', (req, res) => {
  const { name, email, phone, location, message } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }
  const lead = db.leads.insert({
    name, email, phone,
    location: location || '',
    message: message || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({
    lead,
    message: "Thanks! A Nestora Properties representative will contact you within 24 hours to discuss selling your property.",
  });
});

// ── ADMIN: view + manage inbound sell requests ──
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const leads = db.leads.all();
  res.json({ count: leads.length, leads });
});

router.patch('/:id/contacted', requireAuth, requireRole('admin'), (req, res) => {
  const lead = db.leads.update(req.params.id, { status: 'contacted' });
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ lead });
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const ok = db.leads.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ message: 'Lead removed.' });
});

module.exports = router;
