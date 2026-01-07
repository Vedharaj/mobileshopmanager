const User = require('../models/user');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password_hash');
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('getUser error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.pushTokens = Array.from(new Set([...(user.pushTokens || []), token]));
    await user.save();
    res.json({ message: 'Push token saved' });
  } catch (e) {
    console.error('savePushToken error', e);
    res.status(500).json({ message: 'Server error' });
  }
};