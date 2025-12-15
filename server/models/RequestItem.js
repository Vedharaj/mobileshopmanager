const mongoose = require('mongoose');

const RequestItemSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, default: 0 },
  note: { type: String, default: '' },
  status: { type: String, default: 'pending' }, // pending | fulfilled | cancelled
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

RequestItemSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('RequestItem', RequestItemSchema);
