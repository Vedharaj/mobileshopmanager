const mongoose = require('mongoose');

const SalesItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit_price: { type: Number, required: true },
  total_price: { type: Number, required: true }
});

const SalesSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' }, // Link to service if sale is from service
  order_date: { type: Date, default: Date.now },
  total_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  payment_method: { type: String, default: 'cash' },
  payment_breakdown: { type: Object },
  status: { type: String, default: 'completed' },
  notes: { type: String },
  items: [SalesItemSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SalesSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Sales', SalesSchema);

