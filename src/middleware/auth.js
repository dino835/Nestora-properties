const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// Attaches req.user if a valid token is present. Does NOT block the request
// if there's no token — use `requireAuth` for that.
function attachUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.findById(payload.id);
    if (user) req.user = user;
  } catch (err) {
    // invalid/expired token — proceed unauthenticated
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You must be signed in to do that.' });
  if (req.user.status === 'suspended') return res.status(403).json({ error: 'Your account has been suspended.' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'You must be signed in to do that.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to do that.' });
    next();
  };
}

module.exports = { signToken, attachUser, requireAuth, requireRole, JWT_SECRET };
