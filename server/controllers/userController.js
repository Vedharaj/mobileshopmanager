const User = require('../models/user');

exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password_hash');
  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password_hash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};