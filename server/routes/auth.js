const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// REGISTER (email + password only)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: 'Please enter all fields' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ msg: 'User already exists' });

    // Let the User model's pre-save hook hash the password.
    const user = new User({
      email,
      password_hash: password
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// LOGIN (email + password only)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: 'Please enter all fields' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, shops: user.shops }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ME (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
