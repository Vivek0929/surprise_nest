const express = require('express');
const router = express.Router();
const Theme = require('../models/Theme');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// ─── GET /api/themes ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { occasion, featured } = req.query;
    const filter = { isActive: true };
    if (occasion) filter.occasions = occasion;
    if (featured === 'true') filter.isFeatured = true;
    const themes = await Theme.find(filter).sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, count: themes.length, themes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/themes/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/themes (admin) ─────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const theme = await Theme.create(req.body);
    res.status(201).json({ success: true, message: 'Theme created', theme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/themes/:id (admin) ──────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const theme = await Theme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    res.json({ success: true, message: 'Theme updated', theme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/themes/:id (admin) ───────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const theme = await Theme.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    res.json({ success: true, message: 'Theme deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
