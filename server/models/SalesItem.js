const mongoose = require('mongoose');

const SalesItemSchema = new mongoose.Schema({
  sales_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1, min: 0.01 },
  unit_price: { type: Number, required: true, min: 0 },
  total_price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  amount_in_cash: { type: Number, default: 0, min: 0 },
  amount_in_ecash: { type: Number, default: 0, min: 0 },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SalesItemSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('SalesItem', SalesItemSchema);
