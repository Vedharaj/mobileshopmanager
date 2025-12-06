const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sales = require('../models/Sales');
const Shop = require('../models/Shop');

// GET /api/sales - return authenticated user's sales (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    res.json({ sales: sales || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/sales/service/:serviceId - get sales by service_id
router.get('/service/:serviceId', auth, async (req, res) => {
  try {
    const serviceId = req.params.serviceId;

    const sales = await Sales.find({ service_id: serviceId })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    res.json({ sales: sales || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/sales/:id - get a single sale by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const saleId = req.params.id;

    const sale = await Sales.findById(saleId)
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    // Check if the authenticated user has access to this sale's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to view this sale' });
    }

    res.json({ sale });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/sales - create a new sale
router.post('/', auth, async (req, res) => {
  try {
    const {
      shop_id,
      user_id,
      customer_id,
      service_id,
      name,
      type,
      order_date,
      total_amount,
      paid_amount,
      balance,
      cash_paid,
      online_paid,
      payment_method,
      payment_breakdown,
      status,
      notes,
      items
    } = req.body;

    if (!shop_id) {
      return res.status(400).json({ msg: 'shop_id is required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(userShopId => userShopId.toString() === shop_id)) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    // If service_id provided but no name, fetch it from Service model
    let finalName = name;
    if (service_id && !finalName) {
      try {
        const Service = require('../models/Service');
        const service = await Service.findById(service_id);
        if (service) {
          finalName = service.name;
        }
      } catch (err) {
        console.warn('Could not fetch name from service_id:', err.message);
      }
    }

    const sale = new Sales({
      shop_id,
      user_id: user_id || req.user._id,
      customer_id: customer_id || null,
      service_id: service_id || null,
      name: finalName || null,
      type: type || 'service',
      order_date: order_date ? new Date(order_date) : new Date(),
      total_amount: total_amount || 0,
      paid_amount: paid_amount || 0,
      balance: balance || 0,
      cash_paid: cash_paid || 0,
      online_paid: online_paid || 0,
      payment_method: payment_method || 'cash',
      payment_breakdown: payment_breakdown || {},
      status: status || 'completed',
      notes: notes || '',
      items: items || []
    });

    await sale.save();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    res.status(201).json({ msg: 'Sale created successfully', sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/sales/:id - update a sale
router.put('/:id', auth, async (req, res) => {
  try {
    const saleId = req.params.id;
    const {
      customer_id,
      service_id,
      order_date,
      total_amount,
      paid_amount,
      balance,
      cash_paid,
      online_paid,
      payment_method,
      payment_breakdown,
      status,
      notes,
      items
    } = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    // Check if the authenticated user has access to this sale's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this sale' });
    }

    if (customer_id !== undefined) sale.customer_id = customer_id || null;
    if (service_id !== undefined) sale.service_id = service_id || null;
    if (order_date) sale.order_date = new Date(order_date);
    if (total_amount !== undefined) sale.total_amount = total_amount;
    if (paid_amount !== undefined) sale.paid_amount = paid_amount;
    if (balance !== undefined) sale.balance = balance;
    if (cash_paid !== undefined) sale.cash_paid = cash_paid;
    if (online_paid !== undefined) sale.online_paid = online_paid;
    if (payment_method) sale.payment_method = payment_method;
    if (payment_breakdown) sale.payment_breakdown = payment_breakdown;
    if (status) sale.status = status;
    if (notes !== undefined) sale.notes = notes || '';
    if (items) sale.items = items;

    await sale.save();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    res.status(200).json({ msg: 'Sale updated successfully', sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/sales/:id - delete a sale
router.delete('/:id', auth, async (req, res) => {
  try {
    const saleId = req.params.id;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    // Check if the authenticated user has access to this sale's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this sale' });
    }

    await sale.deleteOne();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate('items.product_id', 'name selling_price');

    res.status(200).json({ msg: 'Sale deleted successfully', sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

