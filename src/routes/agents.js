const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function ratingSummary(agentId) {
  const revs = db.reviews.filter((r) => r.agentId === agentId);
  const count = revs.length;
  const avg = count ? Math.round((revs.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return { ratingAvg: avg, ratingCount: count };
}

function publicAgent(u) {
  const { password, ...rest } = u;
  return { ...rest, ...ratingSummary(u.id) };
}

// ── PUBLIC: directory of all agents ──
router.get('/', (req, res) => {
  const agents = db.users.filter((u) => u.role === 'agent' && u.status === 'active').map(publicAgent);
  res.json({ count: agents.length, agents });
});

// ── PUBLIC: single agent profile + their live listings + reviews ──
router.get('/:id', (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });

  const listings = db.properties.filter((p) => p.ownerId === user.id && p.status === 'approved');
  const reviews = db.reviews.filter((r) => r.agentId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ agent: publicAgent(user), listings, reviews });
});

// ── Leave (or update) a review for an agent ──
router.post('/:id/reviews', requireAuth, (req, res) => {
  const agentId = Number(req.params.id);
  const user = db.users.findById(agentId);
  if (!user || user.role !== 'agent') return res.status(404).json({ error: 'Agent not found.' });
  if (req.user.id === agentId) return res.status(400).json({ error: 'You cannot review yourself.' });

  const { rating, comment } = req.body;
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const existing = db.reviews.find((r) => r.agentId === agentId && r.reviewerId === req.user.id);
  let review;
  if (existing) {
    review = db.reviews.update(existing.id, { rating: numRating, comment: comment || '', updatedAt: new Date().toISOString() });
  } else {
    review = db.reviews.insert({
      agentId, reviewerId: req.user.id, reviewerName: req.user.name,
      rating: numRating, comment: comment || '', createdAt: new Date().toISOString(),
    });
  }
  res.status(201).json({ review, ...ratingSummary(agentId) });
});

module.exports = router;
