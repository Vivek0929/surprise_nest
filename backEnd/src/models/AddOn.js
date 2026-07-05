const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' }, // Cloudinary URL
    category: {
      type: String,
      enum: ['Food', 'Flowers', 'Photo', 'Gift', 'Entertainment', 'Other'],
      default: 'Other',
    },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AddOn', addonSchema);
