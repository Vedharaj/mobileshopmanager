const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true }, // Generated automatically
  qty: { type: Number, default: 0 },
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  minimum_stock: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Pre-save hook to generate barcode atomically
ProductSchema.pre('save', async function (next) {
  try {
    // Only generate barcode for new products
    if (this.isNew && !this.barcode) {
      // Get Counter model (already registered in server.js)
      const Counter = mongoose.model('Counter');
      
      // Atomically increment counter using findOneAndUpdate with upsert
      const counter = await Counter.findOneAndUpdate(
        { _id: 'product_barcode' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      // Generate barcode with format: PR + 6-digit zero-padded number
      const BARCODE_PREFIX = 'PR';
      const serialNumber = counter.sequence_value;
      this.barcode = BARCODE_PREFIX + serialNumber.toString().padStart(6, '0');
    }

    // Update the updated_at timestamp
    this.updated_at = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Product', ProductSchema);

