const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Same read-only-filesystem constraint as db.js: only /tmp is writable on
// Vercel, and it isn't guaranteed to persist between invocations.
const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/nestora-uploads'
  : path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, or WEBP images are allowed.'), ok);
  },
});

// Sellers/agents upload a property photo, get back a URL to use in their listing
router.post('/', requireAuth, requireRole('agent'), upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

module.exports = router;
