const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const deliveryOnly = require('../middleware/deliveryOnly');

const guard = [protect, deliveryOnly];

// ─── GET /api/delivery/my-orders ──────────────────────────────────────────────
router.get('/my-orders', guard, async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('user', 'name phone')
      .populate('theme', 'name images')
      .sort({ deliveryDate: 1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/delivery/orders/:id/status ──────────────────────────────────────
router.put('/orders/:id/status', guard, async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['out_for_delivery', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Delivery partners can only set out_for_delivery or delivered' });
    }
    const order = await Order.findOne({ _id: req.params.id, deliveryPartner: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    await order.save();
    res.json({ success: true, message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/delivery/orders/:id ────────────────────────────────────────────
router.get('/orders/:id', guard, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, deliveryPartner: req.user._id })
      .populate('user', 'name phone')
      .populate('theme', 'name images items')
      .populate('addOns.addOn', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
