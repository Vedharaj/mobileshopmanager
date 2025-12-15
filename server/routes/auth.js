const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');

// REGISTER (email + password + username)
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username)
      return res.status(400).json({ msg: 'Please enter all fields' });

    // check existing by email or username
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(400).json({ msg: 'Email or username already in use' });

    // Let the User model's pre-save hook hash the password.
    const user = new User({
      email,
      password_hash: password,
      username
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      shops: user.shops // shops is now an array of ObjectIds
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// LOGIN (email or username + password)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // Changed from email to identifier
    // console.log(identifier, password);
    

    if (!identifier || !password)
      return res.status(400).json({ msg: 'Please enter username/email and password' }); // Updated error message

    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }); // Search by email or username
    if (!user) {
      // console.log("User not found for identifier:", identifier);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // console.log("User found:", user.username, user.email, user.role);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    // console.log("Password match result:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      token,
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      shops: user.shops // shops is now an array of ObjectIds
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
    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      shops: user.shops || [] // shops is now an array of ObjectIds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATE PROFILE (protected)
router.put('/updateProfile', auth, async (req, res) => {
  try {
    const { email, username } = req.body;
    const user = await User.findById(req.user.id);

    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if both email and username are provided and are the same as current ones
    if (email && username && user.email === email && user.username === username) {
      return res.status(400).json({ msg: 'New email or username cannot be the same as old ones' });
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      user.email = email;
    }

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Username already in use' });
      }
      user.username = username;
    }

    await user.save();

    res.status(200).json({
      msg: 'Profile updated successfully',
      user: { id: user._id, email: user.email, username: user.username, role: user.role },
      shops: user.shops || [] // shops is now an array of ObjectIds
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
