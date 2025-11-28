const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserShopSubSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  shop_name: { type: String },
  shop_contactno: { type: String },
  shop_address: { type: String },
  role_in_shop: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'owner' },
  membership_level: { type: String },
  shops: [UserShopSubSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password_hash);
};

UserSchema.pre('save', async function (next) {
  if (this.isModified('password_hash')) {
    // assume password_hash currently holds plain password for initial seeding or when explicitly set
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
