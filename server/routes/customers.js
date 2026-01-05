const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');

// GET /api/customers - return customers for the authenticated user/shop
router.get('/', auth, async (req, res) => {
  try {
    // If you want to filter by user or shop, adjust the query below
    // Example: const customers = await Customer.find({ user_id: req.user.id })
    // For now, return all customers (legacy behavior)
    // const customers = await Customer.find({ user_id: req.user.id }).sort({ created_at: -1 });
    const customers = await Customer.find({
      // Uncomment and adjust if you add user/shop reference to Customer model
      // user_id: req.user.id
    }).sort({ created_at: -1 });
    res.json({ customers: customers || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/customers - create a new customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone_no, address } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const customer = new Customer({
      name,
      phone_no: phone_no || '',
      address: address || ''
    });

    await customer.save();

    // Return all customers
    const customers = await Customer.find().sort({ created_at: -1 });
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
    const { name, phone_no, address } = req.body;

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
    await customer.save();

    // Return all customers
    const customers = await Customer.find().sort({ created_at: -1 });
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

    // Return all customers
    const customers = await Customer.find().sort({ created_at: -1 });
    res.status(200).json({ msg: 'Customer deleted successfully', customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

