const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
try {
const { username, email, password } = req.body;
// console.log(req.body);
if (!username || !email || !password) return res.status(400).json({ msg: 'Please enter all fields ' });


const existing = await User.findOne({ email });
if (existing) return res.status(400).json({ msg: 'User already exists' });


const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);


const user = new User({ username, email, password: hash });
await user.save();


const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });


res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
} catch (err) {
console.error(err);
res.status(500).json({ msg: 'Server error' });
}
});


// Login
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ msg: 'Please enter all fields' });


const user = await User.findOne({ email });
if (!user) return res.status(400).json({ msg: 'Invalid credentials' });


const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });


const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });


res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
} catch (err) {
console.error(err);
res.status(500).json({ msg: 'Server error' });
}
});


// Get user (protected)
router.get('/me', auth, async (req, res) => {
try {
const user = await User.findById(req.user.id).select('-password');
res.json(user);
} catch (err) {
console.error(err);
res.status(500).json({ msg: 'Server error' });
}
});


module.exports = router;