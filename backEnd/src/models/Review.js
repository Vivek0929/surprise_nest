const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    isVerified: { type: Boolean, default: true }, // verified purchase
  },
  { timestamps: true }
);

// One review per order
reviewSchema.index({ order: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
