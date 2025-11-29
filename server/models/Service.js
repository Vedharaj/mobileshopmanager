const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  service_name: { type: String, required: true },
  description: { type: String },
  total_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  payment_method: { type: String, default: 'cash' },
  payment_breakdown: { type: Object },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ServiceSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Service', ServiceSchema);

