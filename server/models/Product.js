const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  qty: { type: Number, default: 0 },
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  minimum_stock: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ProductSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);

