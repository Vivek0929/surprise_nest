const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Theme = require('../models/Theme');
const AddOn = require('../models/AddOn');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const guard = [protect, adminOnly];

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', guard, async (req, res) => {
  try {
    const [totalOrders, totalRevenue, pendingOrders, deliveredOrders, totalCustomers, lowStockItems] =
      await Promise.all([
        Order.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$amounts.total' } } }]),
        Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } }),
        Order.countDocuments({ status: 'delivered' }),
        User.countDocuments({ role: 'customer' }),
        Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
      ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('theme', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        deliveredOrders,
        totalCustomers,
        lowStockItems,
      },
      recentOrders,
      statusBreakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/orders ─────────────────────────────────────────────────────
router.get('/orders', guard, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('theme', 'name images')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/admin/orders/:id/status ─────────────────────────────────────────
router.put('/orders/:id/status', guard, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    await order.save();
    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/admin/orders/:id/assign ─────────────────────────────────────────
router.put('/orders/:id/assign', guard, async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const partner = await User.findOne({ _id: deliveryPartnerId, role: 'delivery' });
    if (!partner) return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPartner: deliveryPartnerId },
      { new: true }
    ).populate('deliveryPartner', 'name phone');
    res.json({ success: true, message: 'Delivery partner assigned', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/delivery-partners ─────────────────────────────────────────
router.get('/delivery-partners', guard, async (req, res) => {
  try {
    const partners = await User.find({ role: 'delivery', isActive: true }).select('-password');
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/admin/delivery-partners ────────────────────────────────────────
router.post('/delivery-partners', guard, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const partner = await User.create({ name, email, password, phone, role: 'delivery' });
    res.status(201).json({ success: true, message: 'Delivery partner created', partner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/inventory ──────────────────────────────────────────────────
router.get('/inventory', guard, async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ quantity: 1 });
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/admin/inventory/:id ─────────────────────────────────────────────
router.put('/inventory/:id', guard, async (req, res) => {
  try {
    const { quantity, lowStockThreshold } = req.body;
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity, lowStockThreshold },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.json({ success: true, message: 'Inventory updated', item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/reports ────────────────────────────────────────────────────
router.get('/reports', guard, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [revenueByDay, topThemes, ordersByOccasion] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amounts.total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$theme', count: { $sum: 1 }, revenue: { $sum: '$amounts.total' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'themes', localField: '_id', foreignField: '_id', as: 'theme' } },
        { $unwind: '$theme' },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$occasion', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ success: true, reports: { revenueByDay, topThemes, ordersByOccasion } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
