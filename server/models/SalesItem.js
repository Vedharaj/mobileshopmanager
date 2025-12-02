const mongoose = require('mongoose');

// Standalone SalesItem schema (for reference/legacy support)
// Note: SalesItems are now primarily stored as embedded sub-documents in Sales.items
const SalesItemSchema = new mongoose.Schema({
  sales_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1, min: 0.01 },
  unit_price: { type: Number, required: true, min: 0 },
  total_price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Auto-calc total_price before validation
SalesItemSchema.pre('validate', function (next) {
  const base = this.quantity * this.unit_price;
  const discountAmount = this.discount || 0;
  const taxAmount = ((this.tax || 0) / 100) * base;

  this.total_price = base - discountAmount + taxAmount;
  next();
});

SalesItemSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('SalesItem', SalesItemSchema);
