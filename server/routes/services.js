const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Service = require('../models/Service');
const Shop = require('../models/Shop');

// GET /api/services - return authenticated user's services (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    const services = await Service.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name');

    res.json({ services: services || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/services - create a new service
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      shop_id,
      user_id,
      customer_id,
      description,
      total_amount,
      amount_in_cash,
      amount_in_ecash,
      balance,
      status,
      received_date,
      return_date,
      note
    } = req.body;

    if (!name || !shop_id) {
      return res.status(400).json({ msg: 'Service name and shop_id are required' });
    }

    if (!received_date) {
      return res.status(400).json({ msg: 'Received date is required' });
    }

    if (!return_date) {
      return res.status(400).json({ msg: 'Return date is required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(userShopId => userShopId.toString() === shop_id)) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    const amountInCash = amount_in_cash || 0;
    const amountInEcash = amount_in_ecash || 0;
    const totalPaid = amountInCash + amountInEcash;
    const calculatedBalance = (total_amount || 0) - totalPaid;

    const service = new Service({
      name,
      shop_id,
      user_id: user_id || req.user._id,
      customer_id: customer_id || null,
      description: description || '',
      total_amount: total_amount || 0,
      amount_in_cash: amountInCash,
      amount_in_ecash: amountInEcash,
      balance: balance !== undefined ? balance : calculatedBalance,
      status: status || 'pending',
      received_date: received_date ? new Date(received_date) : new Date(),
      return_date: return_date ? new Date(return_date) : new Date(),
      note: note || ''
    });

    await service.save();

    // Emit socket event for new service
    try {
      const { getIO } = require('../socket');
      const populated = await service
        .populate('shop_id', 'name')
        .populate('user_id', 'username')
        .populate('customer_id', 'name');
      getIO().emit('service:new', { service: populated });
    } catch (e) {
      // Non-fatal if socket not initialized
      console.warn('Socket emit failed for service:new', e.message);
    }

    // Return all services for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const services = await Service.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name');

    res.status(201).json({ msg: 'Service created successfully', services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/services/:id - update a service
router.put('/:id', auth, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const {
      name,
      customer_id,
      description,
      total_amount,
      amount_in_cash,
      amount_in_ecash,
      balance,
      status,
      received_date,
      return_date,
      note
    } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    // Check if the authenticated user has access to this service's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === service.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this service' });
    }

    // Update only provided fields (allow partial updates like balance-only changes)
    if (name) service.name = name;
    // name is required, so ensure it's always set
    if (!service.name) {
      return res.status(400).json({ msg: 'Service name is required' });
    }
    if (customer_id !== undefined) service.customer_id = customer_id || null;
    if (description !== undefined) service.description = description || '';
    if (total_amount !== undefined) service.total_amount = total_amount || 0;
    if (amount_in_cash !== undefined) service.amount_in_cash = amount_in_cash || 0;
    if (amount_in_ecash !== undefined) service.amount_in_ecash = amount_in_ecash || 0;
    const totalPaid = (amount_in_cash || 0) + (amount_in_ecash || 0);
    service.balance = balance !== undefined ? balance : (service.total_amount - totalPaid);
    service.status = status || 'pending';
    if (received_date) {
      service.received_date = new Date(received_date);
    }
    if (return_date) {
      service.return_date = new Date(return_date);
    }
    service.note = note || '';
    await service.save();

    // Return all services for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const services = await Service.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name');

    res.status(200).json({ msg: 'Service updated successfully', services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/services/:id - delete a service
router.delete('/:id', auth, async (req, res) => {
  try {
    const serviceId = req.params.id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    // Check if the authenticated user has access to this service's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === service.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this service' });
    }

    await service.deleteOne();

    // Return all services for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const services = await Service.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name');

    res.status(200).json({ msg: 'Service deleted successfully', services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

