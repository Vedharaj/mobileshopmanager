const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  // check existing by email or username
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) return res.status(400).json({ message: 'email or username already in use' });

  const user = new User({ email, password_hash: password, username });
  await user.save();

  const token = generateToken(user);
  res.status(201).json({ 
    token, 
    user: { id: user._id, email: user.email, username: user.username, role: user.role },
    shops: user.shops || []
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'invalid credentials' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(400).json({ message: 'invalid credentials' });

  const token = generateToken(user);
  res.json({ 
    token, 
    user: { id: user._id, email: user.email, username: user.username, role: user.role },
    shops: Array.isArray(user.shops) ? user.shops : []
  });
};

exports.me = async (req, res) => {
  res.json(req.user);
};