const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Theme = require('../models/Theme');
const AddOn = require('../models/AddOn');
const { protect } = require('../middleware/auth');

const DELIVERY_CHARGE = parseInt(process.env.DELIVERY_CHARGE || '100');

// ─── POST /api/orders ──────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { occasion, themeId, addOnIds, hostelDetails, deliveryDate, payment } = req.body;

    // Validate theme
    const theme = await Theme.findById(themeId);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });

    // Validate & price add-ons
    let addOnsAmount = 0;
    const addOns = [];
    if (addOnIds && addOnIds.length > 0) {
      for (const id of addOnIds) {
        const addon = await AddOn.findById(id);
        if (addon && addon.isActive) {
          addOns.push({ addOn: addon._id, name: addon.name, price: addon.price, quantity: 1 });
          addOnsAmount += addon.price;
        }
      }
    }

    const amounts = {
      theme: theme.price,
      addOns: addOnsAmount,
      delivery: DELIVERY_CHARGE,
      total: theme.price + addOnsAmount + DELIVERY_CHARGE,
    };

    const order = await Order.create({
      user: req.user._id,
      occasion,
      theme: theme._id,
      themeName: theme.name,
      themePrice: theme.price,
      addOns,
      hostelDetails,
      deliveryDate: new Date(deliveryDate),
      payment: { method: payment.method, status: payment.method === 'Cash on Delivery' ? 'pending' : 'paid' },
      amounts,
    });

    const populated = await order.populate(['theme', 'addOns.addOn']);
    res.status(201).json({ success: true, message: 'Order placed successfully', order: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders/my-orders ────────────────────────────────────────────────
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('theme', 'name images color')
      .populate('addOns.addOn', 'name price image')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('theme', 'name images items color')
      .populate('addOns.addOn', 'name price image')
      .populate('deliveryPartner', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders/:id/track ────────────────────────────────────────────────
router.get('/:id/track', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .select('orderId status statusHistory deliveryDate deliveryPartner amounts')
      .populate('deliveryPartner', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, tracking: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
