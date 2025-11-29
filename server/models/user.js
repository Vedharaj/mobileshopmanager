const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'owner' },
  membership_level: { type: String },
  shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }], // Modified to store only shop_ids
  contact_no: { type: String }, // Add contact_no field
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password_hash);
};

UserSchema.pre('save', async function (next) {
  // Check if password_hash is modified and if it's not already hashed
  // A simple check for length and presence of bcrypt prefix might be enough
  if (this.isModified('password_hash') && this.password_hash.length < 60) { // bcrypt hashes are typically ~60 chars
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
