const mongoose = require("mongoose");

// ----------------------
// SALES ITEM SUB-SCHEMA
// ----------------------
const SalesItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    product_name: { type: String },
    quantity: { type: Number, required: true, default: 1, min: 0.01 },
    unit_price: { type: Number, required: true, min: 0 },

    discount: { type: Number, default: 0, min: 0 }, // per item discount
    cgst: { type: Number, default: 0, min: 0 }, // CGST %
    sgst: { type: Number, default: 0, min: 0 }, // SGST %

    total_price: { type: Number, required: true, min: 0 }, // auto-calculated

    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-calc total_price and set product_name BEFORE item validated
SalesItemSchema.pre("validate", async function (next) {
  try {
    const base = this.quantity * this.unit_price;
    const discountAmount = this.discount || 0;
    const cgst = this.cgst || 0;
    const sgst = this.sgst || 0;
    const taxAmount = ((cgst + sgst) / 100) * base;

    this.total_price = base - discountAmount + taxAmount;

    // fill product_name from Product if missing
    if (!this.product_name && this.product_id) {
      try {
        const Product = mongoose.model('Product');
        const p = await Product.findById(this.product_id).select('name');
        if (p) this.product_name = p.name;
      } catch (e) {
        // ignore
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ----------------------
// SALES MAIN SCHEMA
// ----------------------
const SalesSchema = new mongoose.Schema(
  {
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    name: { type: String }, // Service/transaction name for reference
    type: { type: String, enum: ['service', 'sales', 'add_money', 'add_expense', 'return_item'], default: 'service' }, // Transaction type
    invoice_no: { type: String, unique: true, sparse: true }, // Auto-generated invoice number

    order_date: { type: Date, default: Date.now },

    items: [SalesItemSchema], // Many items per sale

    total_amount: { type: Number, default: 0 },
    paid_amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    cash_paid: { type: Number, default: 0 },
    online_paid: { type: Number, default: 0 },

    payment_method: { type: String, default: "cash" },
    payment_breakdown: { type: Object },
    payment_status: { type: String, enum: ['paid', 'pending'], default: 'paid' },

    status: { type: String, default: "completed" },

    notes: { type: String },
  },
  { timestamps: true }
);

// -------------------------------------------
// AUTO-GENERATE INVOICE NUMBER
// -------------------------------------------
SalesSchema.pre("save", async function (next) {
  if (!this.invoice_no && this.isNew) {
    try {
      const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
      
      // Find the latest invoice for this year
      const latestSale = await mongoose.model('Sales').findOne({
        invoice_no: new RegExp(`^${year}`)
      }).sort({ invoice_no: -1 });
      
      let nextNumber = 1;
      if (latestSale && latestSale.invoice_no) {
        const lastNumber = parseInt(latestSale.invoice_no.slice(2));
        nextNumber = lastNumber + 1;
      }
      
      // Format: YY + 6 digit number (e.g., 25000001)
      this.invoice_no = `${year}${nextNumber.toString().padStart(6, '0')}`;
    } catch (err) {
      console.error('Error generating invoice number:', err);
    }
  }
  next();
});

// -------------------------------------------
// AUTO-CALCULATE TOTALS FOR ENTIRE SALE
// -------------------------------------------
SalesSchema.pre("validate", function (next) {
  // Calculate total_amount from all items ONLY if items exist
  if (this.items && this.items.length > 0) {
    this.total_amount = this.items.reduce((sum, item) => {
      return sum + (item.total_price || 0);
    }, 0);
    
    // Auto calculate balance for item-based sales
    this.balance = this.total_amount - (this.paid_amount || 0);
  }
  // For service transactions or transactions without items, keep the manually set values
  // Don't override total_amount or balance

  // Ensure valid numbers for payment fields
  this.paid_amount = Math.max(0, this.paid_amount || 0);
  this.cash_paid = Math.max(0, this.cash_paid || 0);
  this.online_paid = Math.max(0, this.online_paid || 0);

  next();
});

module.exports = mongoose.model("Sales", SalesSchema);

