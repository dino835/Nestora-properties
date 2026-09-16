const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route below requires an authenticated admin
router.use(requireAuth, requireRole('admin'));

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ── DASHBOARD STATS ──
router.get('/stats', (req, res) => {
  const properties = db.properties.all();
  const users = db.users.all();
  const leads = db.leads.all();
  res.json({
    totalListings: properties.length,
    pending: properties.filter((p) => p.status === 'pending').length,
    flagged: properties.filter((p) => p.status === 'flagged').length,
    approved: properties.filter((p) => p.status === 'approved').length,
    totalUsers: users.length,
    pendingAgents: users.filter((u) => u.role === 'agent' && !u.verified).length,
    pendingIdentity: users.filter((u) => u.role === 'agent' && u.idVerification && u.idVerification.status === 'pending').length,
    newLeads: leads.filter((l) => l.status === 'new').length,
  });
});

// ── LISTINGS MODERATION ──
// GET /api/admin/properties?status=pending|flagged|approved  (omit for all)
router.get('/properties', (req, res) => {
  const { status } = req.query;
  const properties = status ? db.properties.filter((p) => p.status === status) : db.properties.all();
  res.json({ count: properties.length, properties });
});

router.patch('/properties/:id/approve', (req, res) => {
  const property = db.properties.update(req.params.id, { status: 'approved' });
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  res.json({ property, message: 'Listing approved and now live.' });
});

router.patch('/properties/:id/reject', (req, res) => {
  const ok = db.properties.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Property not found.' });
  res.json({ message: 'Listing rejected and removed.' });
});

// Permanently remove a flagged/scam listing
router.delete('/properties/:id', (req, res) => {
  const ok = db.properties.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Property not found.' });
  res.json({ message: 'Listing removed.' });
});

// ── VERIFIED PROPERTY BADGE (admin confirms the listing was physically/document verified) ──
router.patch('/properties/:id/verify-property', (req, res) => {
  const property = db.properties.update(req.params.id, { verifiedProperty: true });
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  res.json({ property, message: 'Property marked as verified.' });
});

router.patch('/properties/:id/unverify-property', (req, res) => {
  const property = db.properties.update(req.params.id, { verifiedProperty: false });
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  res.json({ property, message: 'Verified badge removed.' });
});

// ── AGENT VERIFICATION ──
router.get('/agents', (req, res) => {
  const agents = db.users.filter((u) => u.role === 'agent').map(publicUser);
  res.json({ count: agents.length, agents });
});

router.patch('/agents/:id/verify', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });
  db.users.update(req.params.id, { verified: true });
  res.json({ message: 'Agent verified.' });
});

router.patch('/agents/:id/unverify', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });
  db.users.update(req.params.id, { verified: false });
  res.json({ message: 'Agent verification revoked.' });
});

// ── IDENTITY VERIFICATION (KYC) — separate from the license-based "Verified Agent" badge ──
router.get('/identity-verifications', (req, res) => {
  const pending = db.users.filter((u) => u.role === 'agent' && u.idVerification && u.idVerification.status === 'pending').map(publicUser);
  res.json({ count: pending.length, agents: pending });
});

router.patch('/agents/:id/identity/approve', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });
  const idVerification = Object.assign({}, user.idVerification, { status: 'verified', reviewedAt: new Date().toISOString() });
  db.users.update(req.params.id, { idVerification });
  res.json({ message: 'Identity verified.' });
});

router.patch('/agents/:id/identity/reject', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });
  const idVerification = Object.assign({}, user.idVerification, { status: 'rejected', reviewedAt: new Date().toISOString() });
  db.users.update(req.params.id, { idVerification });
  res.json({ message: 'Identity verification rejected.' });
});

// ── USER MANAGEMENT ──
router.get('/users', (req, res) => {
  res.json({ count: db.users.all().length, users: db.users.all().map(publicUser) });
});

router.patch('/users/:id/suspend', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Admin accounts cannot be suspended.' });
  db.users.update(req.params.id, { status: 'suspended' });
  res.json({ message: 'User suspended.' });
});

router.patch('/users/:id/activate', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  db.users.update(req.params.id, { status: 'active' });
  res.json({ message: 'User reactivated.' });
});

router.delete('/users/:id', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Admin accounts cannot be deleted.' });
  db.users.remove(req.params.id);
  res.json({ message: 'User deleted.' });
});

// ── REPORTS (scam reports raised against listings) ──
router.get('/reports', (req, res) => {
  const reports = db.reports.all().map((r) => ({
    ...r,
    property: db.properties.findById(r.propertyId),
    reporter: (() => { const u = db.users.findById(r.reportedBy); return u ? publicUser(u) : null; })(),
  }));
  res.json({ count: reports.length, reports });
});

module.exports = router;
