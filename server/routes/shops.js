const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Shop = require('../models/Shop');
const User = require('../models/User');

// GET /api/shops - return authenticated user's shops
router.get('/', auth, async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await req.user.populate('shops'); // Populate the shops field
    res.json({ shops: user.shops || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/shops - create a new Shop and attach to user
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, address, contact_no, membership_level, gstin } = req.body;
    if (!name) return res.status(400).json({ msg: 'Shop name is required' });

    // create Shop document
    const shop = new Shop({
      name,
      email: email || '',
      address: address || '',
      contact_no: contact_no || '',
      membership_level: membership_level || '',
      gstin: gstin || ''
    });

    await shop.save();

    // attach to user's shops subdocument
    const user = req.user;
    user.shops.push(shop._id); // Push only the shop ID

    await user.save();

    // Populate shops before sending response
    await user.populate('shops'); // Populate the shops field

    res.status(201).json({ shop, shops: user.shops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/shops/:shop_id - delete a shop and remove from user
router.delete('/:shop_id', auth, async (req, res) => {
  try {
    const shopId = req.params.shop_id;
    const userId = req.user.id;

    // Find the shop and delete it
    const shop = await Shop.findByIdAndDelete(shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Remove the shop from the user's shops array
    const user = await User.findById(userId);
    user.shops = user.shops.filter(s => s.toString() !== shopId); // Filter by ObjectId directly
    await user.save();

    // Populate shops before sending response
    await user.populate('shops');
    res.status(200).json({ msg: 'Shop deleted successfully', shops: user.shops });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/shops/:shop_id - update a shop
router.put('/:shop_id', auth, async (req, res) => {
  try {
    const shopId = req.params.shop_id;
    const userId = req.user.id;
    const { name, email, address, contact_no, membership_level, gstin } = req.body;

    if (!name) return res.status(400).json({ msg: 'Shop name is required' });

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Check if the authenticated user has access to this shop (is associated with the shopId)
    const isOwnerOrAssociated = req.user.shops.some(s => s.toString() === shopId);
    if (!isOwnerOrAssociated) {
      return res.status(403).json({ msg: 'Unauthorized: Not associated with this shop' });
    }

    // Update shop document
    shop.name = name;
    shop.email = email || '';
    shop.address = address || '';
    shop.contact_no = contact_no || '';
    shop.membership_level = membership_level || '';
    shop.gstin = gstin || '';
    await shop.save();

    // No need to update user's shops subdocument, as it's now just ObjectIds
    // The actual shop document is updated directly.

    // Populate shops before sending response
    const user = await req.user.populate('shops');

    res.status(200).json({ msg: 'Shop updated successfully', shop, shops: user.shops });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
