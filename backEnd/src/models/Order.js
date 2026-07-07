const mongoose = require('mongoose');

const hostelDetailsSchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  hostelName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  collegeName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
});

const orderAddonSchema = new mongoose.Schema({
  addOn: { type: mongoose.Schema.Types.ObjectId, ref: 'AddOn', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['UPI', 'Credit/Debit Card', 'Net Banking', 'Wallet', 'Cash on Delivery'],
    required: true,
  },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  transactionId: { type: String, default: '' },
  paidAt: Date,
});

const amountsSchema = new mongoose.Schema({
  theme: { type: Number, required: true },
  addOns: { type: Number, default: 0 },
  delivery: { type: Number, default: 100 },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => 'SN' + Date.now().toString(36).toUpperCase(),
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    occasion: {
      type: String,
      enum: ['Birthday', 'Friendship Day', 'Farewell', 'Proposal', 'Anniversary', 'Other'],
      required: true,
    },
    theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },
    themeName: String,
    themePrice: Number,
    addOns: [orderAddonSchema],
    hostelDetails: { type: hostelDetailsSchema, required: true },
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
    },
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    payment: { type: paymentSchema, required: true },
    amounts: { type: amountsSchema, required: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Push initial status to history on create
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this._isNew = true;
    this.statusHistory.push({ status: 'placed', note: 'Order placed successfully' });
  } else if (this.isModified('status')) {
    this._statusChanged = true;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
