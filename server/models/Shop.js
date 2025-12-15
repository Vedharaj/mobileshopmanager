const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  contact_no: { type: String },
  membership_level: { type: String },
  gstin: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ShopSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Shop', ShopSchema);