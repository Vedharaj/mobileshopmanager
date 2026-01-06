const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  description: { type: String },
  total_amount: { type: Number, default: 0 },
  amount_in_cash: { type: Number, default: 0 },
  amount_in_ecash: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  received_date: { type: Date, required: true },
  return_date: { type: Date, required: true },
  note: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ServiceSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Service', ServiceSchema);

