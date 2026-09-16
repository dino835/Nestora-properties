const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

router.post('/signup', (req, res) => {
  const { name, email, password, phone, role, license } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  const allowedRoles = ['buyer', 'agent'];
  const finalRole = allowedRoles.includes(role) ? role : 'buyer';

  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.find((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }
  if (finalRole === 'agent' && !license) {
    return res.status(400).json({ error: 'Agent accounts require a license / CAC number.' });
  }

  const record = {
    name: String(name).trim(),
    email: normalizedEmail,
    password: bcrypt.hashSync(String(password), 10),
    phone: phone || '',
    role: finalRole,
    status: 'active',
    joined: new Date().toISOString().slice(0, 10),
  };
  if (finalRole === 'agent') {
    record.verified = false;
    record.license = license;
    record.bio = '';
    record.photo = '';
    record.specialty = '';
    record.yearsExperience = 0;
    record.idVerification = { status: 'none' };
  }

  const user = db.users.insert(record);
  const token = signToken(user);
  res.status(201).json({
    token,
    user: publicUser(user),
    message: finalRole === 'agent'
      ? 'Account created. Your agent profile is pending admin verification before you can publish listings.'
      : 'Account created successfully.',
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ── Update your own profile (name/phone for anyone; bio/photo/specialty/experience for agents) ──
router.patch('/profile', requireAuth, (req, res) => {
  const patch = {};
  const { name, phone, bio, photo, specialty, yearsExperience } = req.body;
  if (name !== undefined) patch.name = String(name).trim() || req.user.name;
  if (phone !== undefined) patch.phone = String(phone).trim();
  if (req.user.role === 'agent') {
    if (bio !== undefined) patch.bio = String(bio).trim();
    if (photo !== undefined) patch.photo = String(photo).trim();
    if (specialty !== undefined) patch.specialty = String(specialty).trim();
    if (yearsExperience !== undefined) patch.yearsExperience = Number(yearsExperience) || 0;
  }
  const user = db.users.update(req.user.id, patch);
  res.json({ user: publicUser(user) });
});

// ── Agent submits (or resubmits) identity verification for admin review ──
router.post('/identity-verification', requireAuth, (req, res) => {
  if (req.user.role !== 'agent') return res.status(403).json({ error: 'Only agents can submit identity verification.' });
  const { documentType, documentNumber, documentPhotoUrl } = req.body;
  if (!documentType || !documentNumber) {
    return res.status(400).json({ error: 'Document type and number are required.' });
  }
  const idVerification = {
    status: 'pending',
    documentType,
    documentNumber,
    documentPhotoUrl: documentPhotoUrl || '',
    submittedAt: new Date().toISOString(),
  };
  const user = db.users.update(req.user.id, { idVerification });
  res.json({ user: publicUser(user), message: 'Identity documents submitted. Our team will review within 48 hours.' });
});

module.exports = router;
