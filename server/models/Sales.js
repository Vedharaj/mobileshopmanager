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

    quantity: { type: Number, required: true, default: 1, min: 0.01 },
    unit_price: { type: Number, required: true, min: 0 },

    discount: { type: Number, default: 0, min: 0 }, // per item discount
    tax: { type: Number, default: 0, min: 0 }, // per item tax %

    total_price: { type: Number, required: true, min: 0 }, // auto-calculated

    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-calc total_price BEFORE item validated
SalesItemSchema.pre("validate", function (next) {
  const base = this.quantity * this.unit_price;
  const discountAmount = this.discount || 0;
  const taxAmount = ((this.tax || 0) / 100) * base;

  this.total_price = base - discountAmount + taxAmount;
  next();
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
    service_name: { type: String }, // Service name for reference

    order_date: { type: Date, default: Date.now },

    items: [SalesItemSchema], // Many items per sale

    total_amount: { type: Number, default: 0 },
    paid_amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    payment_method: { type: String, default: "cash" },
    payment_breakdown: { type: Object },

    status: { type: String, default: "completed" },

    notes: { type: String },
  },
  { timestamps: true }
);

// -------------------------------------------
// AUTO-CALCULATE TOTALS FOR ENTIRE SALE
// -------------------------------------------
SalesSchema.pre("validate", function (next) {
  // Calculate total_amount from all items
  if (this.items && this.items.length > 0) {
    this.total_amount = this.items.reduce((sum, item) => {
      return sum + (item.total_price || 0);
    }, 0);
  } else {
    this.total_amount = 0;
  }

  // Ensure valid numbers for payment fields
  this.paid_amount = Math.max(0, this.paid_amount || 0);

  // Auto calculate balance
  this.balance = this.total_amount - this.paid_amount;

  next();
});

module.exports = mongoose.model("Sales", SalesSchema);

