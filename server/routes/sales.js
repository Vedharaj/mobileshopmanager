const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sales = require('../models/Sales');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// GET /api/sales - return authenticated user's sales (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    // Optional query params for faster loading of recent data
    // days: number of days back from now (e.g., 30)
    // from/to: ISO dates to bound by order_date
    // limit: max number of records to return
    const { days, from, to, limit } = req.query;

    const query = { shop_id: { $in: shopIds } };

    // Build date filter
    const now = new Date();
    let dateFilter = null;
    if (days && !isNaN(parseInt(days))) {
      const daysNum = Math.max(1, parseInt(days));
      const fromDate = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);
      dateFilter = { $gte: fromDate };
    }
    if (from || to) {
      dateFilter = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }
    if (dateFilter) {
      // Filter by order_date which represents the transaction date
      query.order_date = dateFilter;
    }

    let q = Sales.find(query)
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name address phone_no')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      })
      // Use createdAt for recency; fallback sort by invoice_no if needed
      .sort({ createdAt: -1 });

    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      q = q.limit(limitNum);
    }

    const sales = await q.exec();

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
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name address phone_no')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      });

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
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name address phone_no')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      });

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

    console.log('=== SALES POST REQUEST ===');
    console.log('Received body:', JSON.stringify(req.body, null, 2));

    if (!shop_id) {
      return res.status(400).json({ msg: 'shop_id is required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(userShopId => userShopId.toString() === shop_id)) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    // Validate items if present
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.product_id) {
          return res.status(400).json({ msg: 'Each item must have a product_id' });
        }
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({ msg: 'Each item must have quantity > 0' });
        }
        if (item.unit_price === undefined || item.unit_price === null) {
          return res.status(400).json({ msg: 'Each item must have unit_price' });
        }
      }
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

    let mappedItems = items || [];
    if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map(i => i.product_id).filter(Boolean);
      const products = await Product.find({ _id: { $in: productIds } })
        .select('cgst sgst category_id')
        .populate('category_id', 'name');
      const productMap = products.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
      }, {});

      mappedItems = items.map((it) => {
        const prod = productMap[it.product_id?.toString()] || {};
        const cgst = it.cgst ?? prod.cgst ?? 0;
        const sgst = it.sgst ?? prod.sgst ?? 0;
        const qty = Number(it.quantity || 0);
        const unit = Number(it.unit_price || 0);
        const discount = Number(it.discount || 0);
        const taxAmount = ((cgst + sgst) / 100) * (qty * unit);
        const total_price = it.total_price ?? qty * unit - discount + taxAmount;
        const category_id =
          it.category_id || prod?.category_id?._id || prod?.category_id || null;
        const category_name = it.category_name || prod?.category_id?.name || null;
        return { ...it, cgst, sgst, total_price, category_id, category_name };
      });
    }

    const sale = new Sales({
      shop_id,
      user_id: user_id || req.user._id,
      customer_id: customer_id || null,
      service_id: service_id || null,
      name: finalName || "Sale",
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
      items: mappedItems
    });

    console.log('Creating sale with data:', JSON.stringify(sale, null, 2));

    await sale.save();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name address phone_no')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      });

    res.status(201).json({ msg: 'Sale created successfully', sales });
  } catch (err) {
    console.error('Sales creation error:', err);
    
    // Check if it's a Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }
    
    res.status(500).json({ msg: err.message || 'Server error' });
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

    let mappedItems = items;
    if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map(i => i.product_id).filter(Boolean);
      const products = await Product.find({ _id: { $in: productIds } })
        .select('cgst sgst category_id')
        .populate('category_id', 'name');
      const productMap = products.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
      }, {});

      mappedItems = items.map((it) => {
        const prod = productMap[it.product_id?.toString()] || {};
        const cgst = it.cgst ?? prod.cgst ?? 0;
        const sgst = it.sgst ?? prod.sgst ?? 0;
        const qty = Number(it.quantity || 0);
        const unit = Number(it.unit_price || 0);
        const discount = Number(it.discount || 0);
        const taxAmount = ((cgst + sgst) / 100) * (qty * unit);
        const total_price = it.total_price ?? qty * unit - discount + taxAmount;
        const category_id =
          it.category_id || prod?.category_id?._id || prod?.category_id || null;
        const category_name = it.category_name || prod?.category_id?.name || null;
        return { ...it, cgst, sgst, total_price, category_id, category_name };
      });
    }

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
    if (items) sale.items = mappedItems;

    await sale.save();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name address phone_no')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      });

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

    // If this sale is linked to a service, add the paid amount back to the service balance
    if (sale.service_id) {
      try {
        const Service = require('../models/Service');
        const service = await Service.findById(sale.service_id);
        if (service) {
          const paidAmount = sale.paid_amount || 0;
          service.balance = (service.balance || 0) + paidAmount;
          await service.save();
        }
      } catch (err) {
        console.error('Error updating service balance:', err);
      }
    }

    await sale.deleteOne();

    // Return all sales for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const sales = await Sales.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name email address contact_no membership_level gstin')
      .populate('user_id', 'username')
      .populate('customer_id', 'name')
      .populate('service_id', 'name')
      .populate({
        path: 'items.product_id',
        select: 'name selling_price cgst sgst category_id',
        populate: { path: 'category_id', select: 'name' },
      });

    res.status(200).json({ msg: 'Sale deleted successfully', sales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

