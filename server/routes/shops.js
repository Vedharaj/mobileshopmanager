const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shop = require('../models/Shop');
const User = require('../models/user');

// GET /api/shops - return authenticated user's shops
router.get('/', auth, async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = req.user;
    res.json({ shops: user.shops || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/shops - create a new Shop and attach to user
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, address, contact_no, membership_level } = req.body;
    if (!name) return res.status(400).json({ msg: 'Shop name is required' });

    // create Shop document
    const shop = new Shop({
      name,
      email: email || '',
      address: address || '',
      contact_no: contact_no || '',
      membership_level: membership_level || ''
    });

    await shop.save();

    // attach to user's shops subdocument
    const user = req.user;
    user.shops = user.shops || [];
    user.shops.push({
      shop_id: shop._id,
      shop_name: shop.name,
      shop_contactno: shop.contact_no || '',
      shop_address: shop.address || '',
      role_in_shop: 'owner'
    });

    await user.save();

    res.status(201).json({ shop, shops: user.shops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
