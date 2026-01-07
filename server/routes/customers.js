const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');

// GET /api/customers - return authenticated user's customers (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    // Find customers that either belong to user's shops OR don't have shop_id yet (legacy)
    const customers = await Customer.find({
      $or: [
        { shop_id: { $in: shopIds } },
        { shop_id: { $exists: false } },
        { shop_id: null }
      ]
    }).populate('shop_id', 'name').sort({ created_at: -1 });
    
    res.json({ customers: customers || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/customers - create a new customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone_no, address, shop_id } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    if (!shop_id) {
      return res.status(400).json({ msg: 'Shop is required' });
    }

    const customer = new Customer({
      name,
      phone_no: phone_no || '',
      address: address || '',
      shop_id
    });

    await customer.save();

    // Return all customers from user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const customers = await Customer.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name').sort({ created_at: -1 });
    
    res.status(201).json({ msg: 'Customer created successfully', customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/customers/:id - update a customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { name, phone_no, address, shop_id } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    customer.name = name;
    customer.phone_no = phone_no || '';
    customer.address = address || '';
    if (shop_id) {
      customer.shop_id = shop_id;
    }
    await customer.save();

    // Return all customers from user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const customers = await Customer.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name').sort({ created_at: -1 });
    
    res.status(200).json({ msg: 'Customer updated successfully', customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/customers/:id - delete a customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    await customer.deleteOne();

    // Return all customers from user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const customers = await Customer.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name').sort({ created_at: -1 });
    
    res.status(200).json({ msg: 'Customer deleted successfully', customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

