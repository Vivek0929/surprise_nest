const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Theme = require('../models/Theme');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// ─── POST /api/reviews ────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, themeId, rating, comment } = req.body;

    // Verify order belongs to user and is delivered
    const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'delivered' });
    if (!order) {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }

    const review = await Review.create({
      order: orderId, user: req.user._id, theme: themeId, rating, comment,
    });

    // Update theme rating
    const allReviews = await Review.find({ theme: themeId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Theme.findByIdAndUpdate(themeId, { rating: avgRating.toFixed(1), reviewCount: allReviews.length });

    res.status(201).json({ success: true, message: 'Review submitted', review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/reviews/theme/:themeId ──────────────────────────────────────────
router.get('/theme/:themeId', async (req, res) => {
  try {
    const reviews = await Review.find({ theme: req.params.themeId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
