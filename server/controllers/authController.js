const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'username already in use' });

  const user = new User({ username, email, password_hash: password });
  await user.save();

  const token = generateToken(user);
  res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'invalid credentials' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(400).json({ message: 'invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
};

exports.me = async (req, res) => {
  res.json(req.user);
};