const deliveryOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'delivery' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Delivery partners only' });
  }
};

module.exports = deliveryOnly;
