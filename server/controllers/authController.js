const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'email already in use' });

  const user = new User({ email, password_hash: password });
  await user.save();

  const token = generateToken(user);
  res.status(201).json({ token, user: { id: user._id, email: user.email } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'invalid credentials' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(400).json({ message: 'invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: { id: user._id, email: user.email } });
};

exports.me = async (req, res) => {
  res.json(req.user);
};