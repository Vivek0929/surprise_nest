const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, default: '' },
    occasions: [
      {
        type: String,
        enum: ['Birthday', 'Friendship Day', 'Farewell', 'Proposal', 'Anniversary', 'Other'],
      },
    ],
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }], // Cloudinary URLs
    items: [{ type: String }],  // Included items list e.g. "Banner", "Balloons"
    color: { type: String, default: '#7C3AED' }, // accent color for display
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from name
themeSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Theme', themeSchema);
