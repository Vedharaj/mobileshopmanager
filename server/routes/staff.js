const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Shop = require('../models/Shop'); // Assuming staff are associated with a shop
const bcrypt = require('bcryptjs');

// GET /api/staff - return authenticated user's staff (associated with their shops)
router.get('/', auth, async (req, res) => {
  try {
    // Fetch shops associated with the authenticated user
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    // Find all users who are staff, and are associated with the owner's shops
    const staffMembers = await User.find({
      role: 'staff',
      shops: { $in: shopIds } // Assuming staff can be associated with multiple shops
    }).select('-password_hash'); // Exclude password hash from the response

    res.json({ staff: staffMembers || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/staff - create a new staff member and associate with a shop
router.post('/', auth, async (req, res) => {
  try {
    const { username, password, email, contact_no, shopId } = req.body;

    if (!username || !password || !shopId) {
      return res.status(400).json({ msg: 'Username, password, and shop ID are required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findOne({ _id: shopId });
    if (!shop || !req.user.shops.some(userShopId => userShopId.equals(shop._id))) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    // Check if username already exists
    let existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: 'Username already taken' });
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create new staff user
    const staff = new User({
      username,
      email: email === '' ? undefined : email, // Set to undefined if empty string
      password_hash,
      role: 'staff',
      shops: [shopId], // Associate staff with the provided shop
      contact_no: contact_no || '', // Add contact_no
    });

    await staff.save();

    // Optionally, return all staff members associated with the owner's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const staffMembers = await User.find({
      role: 'staff',
      shops: { $in: shopIds }
    }).select('-password_hash');

    res.status(201).json({ msg: 'Staff created successfully', staff: staffMembers });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/staff/:id - update a staff member
router.put('/:id', auth, async (req, res) => {
  try {
    const staffId = req.params.id;
    const { username, password, email, contact_no } = req.body;

    if (!username) return res.status(400).json({ msg: 'Username is required' });

    // Find the staff member
    const staffMember = await User.findById(staffId);
    if (!staffMember || staffMember.role !== 'staff') {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Check if the authenticated user has access to update this staff (owner of the associated shop)
    const isOwnerOfShop = req.user.shops.some(shopId => staffMember.shops.includes(shopId));
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this staff member' });
    }

    // Update fields
    staffMember.username = username;
    if (email !== undefined) { // Only update email if it's provided in the request
      staffMember.email = email === '' ? undefined : email; // Set to undefined if empty string
    }
    if (contact_no !== undefined) { // Only update contact_no if it's provided
      staffMember.contact_no = contact_no === '' ? undefined : contact_no; // Set to undefined if empty string
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      staffMember.password_hash = await bcrypt.hash(password, salt);
    }

    await staffMember.save();

    // Optionally, return all staff members associated with the owner's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const staffMembersUpdated = await User.find({
      role: 'staff',
      shops: { $in: shopIds }
    }).select('-password_hash');

    res.status(200).json({ msg: 'Staff updated successfully', staff: staffMembersUpdated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/staff/:id - delete a staff member
router.delete('/:id', auth, async (req, res) => {
  try {
    const staffId = req.params.id;

    // Find the staff member and delete them
    const staffMember = await User.findById(staffId);
    if (!staffMember || staffMember.role !== 'staff') {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    // Check if the authenticated user has access to delete this staff (owner of the associated shop)
    const isOwnerOfShop = req.user.shops.some(shopId => staffMember.shops.includes(shopId));
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this staff member' });
    }

    await staffMember.deleteOne();

    // Optionally, return all staff members associated with the owner's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const staffMembersRemaining = await User.find({
      role: 'staff',
      shops: { $in: shopIds }
    }).select('-password_hash');

    res.status(200).json({ msg: 'Staff deleted successfully', staff: staffMembersRemaining });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
