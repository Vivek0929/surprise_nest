const express = require('express');
const router = express.Router();
const AddOn = require('../models/AddOn');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// ─── GET /api/addons ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const addons = await AddOn.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, count: addons.length, addons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/addons (admin) ─────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const addon = await AddOn.create(req.body);
    res.status(201).json({ success: true, message: 'Add-on created', addon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/addons/:id (admin) ──────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const addon = await AddOn.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
    res.json({ success: true, message: 'Add-on updated', addon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/addons/:id (admin) ───────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const addon = await AddOn.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
    res.json({ success: true, message: 'Add-on deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
