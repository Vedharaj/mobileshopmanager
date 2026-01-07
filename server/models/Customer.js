const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone_no: { type: String },
  address: { type: String },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

CustomerSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Customer', CustomerSchema);

