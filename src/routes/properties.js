const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── PUBLIC: browse only approved listings, with optional filters ──
// GET /api/properties?type=sale&minPrice=&maxPrice=&beds=&city=&q=
router.get('/', (req, res) => {
  let results = db.properties.filter((p) => p.status === 'approved');

  const { type, minPrice, maxPrice, beds, city, q } = req.query;
  if (type === 'sale') results = results.filter((p) => p.badge === 'For Sale');
  if (type === 'rent') results = results.filter((p) => p.badge === 'For Rent');
  if (type === 'shortlet') results = results.filter((p) => p.badge === 'Shortlet');
  if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));
  if (beds) results = results.filter((p) => p.beds >= Number(beds));
  if (city) results = results.filter((p) => p.city === String(city).toLowerCase());
  if (q) {
    const term = String(q).toLowerCase();
    results = results.filter((p) =>
      p.title.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term)
    );
  }

  res.json({ count: results.length, properties: results });
});

// ── Get current user's own listings (seller/agent) — must be before /:id ──
router.get('/mine', requireAuth, requireRole('agent'), (req, res) => {
  const mine = db.properties.filter((p) => p.ownerId === req.user.id);
  res.json({ count: mine.length, properties: mine });
});

// ── PUBLIC: single listing detail (any status is viewable directly by id) ──
router.get('/:id', (req, res) => {
  const property = db.properties.findById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  res.json({ property });
});

// ── Seller/Agent: submit a new listing → always starts as "pending" ──
router.post('/', requireAuth, requireRole('agent'), (req, res) => {
  const {
    title, location, badge, price, beds, baths, area, parking,
    lat, lng, img, desc, tags, type, city,
  } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({ error: 'Title, location, and price are required.' });
  }

  const priceSuffix = badge === 'For Rent' ? '/yr' : badge === 'Shortlet' ? '/night' : '';
  const record = {
    title, location,
    badge: badge || 'For Sale',
    price: Number(price),
    priceStr: '₦' + Number(price).toLocaleString() + priceSuffix,
    type: type || 'apartment',
    beds: Number(beds) || 0,
    baths: Number(baths) || 0,
    area: area || '—',
    parking: Number(parking) || 0,
    img: img || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    desc: desc || '',
    tags: Array.isArray(tags) ? tags : [],
    city: (city || 'lagos').toLowerCase(),
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    status: 'pending',
    verifiedProperty: false,
    ownerId: req.user.id,
    ownerType: req.user.role,
    createdAt: new Date().toISOString(),
  };

  const property = db.properties.insert(record);
  res.status(201).json({ property, message: 'Listing submitted for admin approval.' });
});

// ── Owner (or admin) deletes their own listing ──
router.delete('/:id', requireAuth, (req, res) => {
  const property = db.properties.findById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  const isOwner = property.ownerId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'You can only delete your own listings.' });
  db.properties.remove(req.params.id);
  res.json({ message: 'Listing deleted.' });
});

// ── Any signed-in user reports a listing as a scam/suspicious ──
router.post('/:id/report', requireAuth, (req, res) => {
  const property = db.properties.findById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });

  db.reports.insert({
    propertyId: property.id,
    reportedBy: req.user.id,
    reason: req.body.reason || 'No reason provided',
    createdAt: new Date().toISOString(),
  });
  db.properties.update(property.id, { status: 'flagged' });

  res.json({ message: 'Thanks — this listing has been flagged and sent to our admin team for review.' });
});

module.exports = router;
