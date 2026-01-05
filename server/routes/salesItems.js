const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SalesItem = require('../models/SalesItem');
const Sales = require('../models/Sales');
const Product = require('../models/Product');

// GET /api/sales-items/:salesId - get all items for a specific sale
router.get('/:salesId', auth, async (req, res) => {
  try {
    const { salesId } = req.params;

    // Find the sale and verify user has access
    const sale = await Sales.findById(salesId);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to view this sale items' });
    }

    // Get all items for this sale
    const items = await SalesItem.find({ sales_id: salesId })
      .populate('product_id', 'name category selling_price')
      .sort({ created_at: -1 });

    res.json({ items: items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/sales-items/item/:itemId - get a single sales item by ID
router.get('/item/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await SalesItem.findById(itemId)
      .populate('product_id', 'name category selling_price')
      .populate('sales_id', 'order_date total_amount');

    if (!item) {
      return res.status(404).json({ msg: 'Sales item not found' });
    }

    // Check authorization by finding the sale and verifying shop access
    const sale = await Sales.findById(item.sales_id);
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to view this item' });
    }

    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/sales-items - create a new sales item for a sale
router.post('/', auth, async (req, res) => {
  try {
    const {
      sales_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price,
      discount,
      tax,
      amount_in_cash,
      amount_in_ecash,
      notes
    } = req.body;

    if (!sales_id || !product_id) {
      return res.status(400).json({ msg: 'sales_id and product_id are required' });
    }

    // Find the sale and verify user has access
    const sale = await Sales.findById(sales_id);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to add items to this sale' });
    }

    // Try to resolve product_name if not provided
    let finalProductName = product_name;
    if (!finalProductName) {
      try {
        const p = await Product.findById(product_id).select('name');
        if (p) finalProductName = p.name;
      } catch (e) {
        // ignore
      }
    }

    const item = new SalesItem({
      sales_id,
      product_id,
      product_name: finalProductName,
      quantity: quantity || 1,
      unit_price: unit_price || 0,
      total_price: total_price || (quantity * unit_price) || 0,
      discount: discount || 0,
      tax: tax || 0,
      amount_in_cash: amount_in_cash || 0,
      amount_in_ecash: amount_in_ecash || 0,
      notes: notes || ''
    });

    await item.save();

    // Return all items for this sale
    const items = await SalesItem.find({ sales_id })
      .populate('product_id', 'name category selling_price')
      .sort({ created_at: -1 });

    res.status(201).json({ msg: 'Sales item created successfully', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/sales-items/bulk - create multiple sales items at once
router.post('/bulk/:salesId', auth, async (req, res) => {
  try {
    const { salesId } = req.params;
    const { items: itemsData } = req.body;

    if (!Array.isArray(itemsData) || itemsData.length === 0) {
      return res.status(400).json({ msg: 'items array is required and must not be empty' });
    }

    // Find the sale and verify user has access
    const sale = await Sales.findById(salesId);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to add items to this sale' });
    }

    // Resolve product names in bulk (fetch names for any product_ids that lack product_name)
    const productIds = itemsData.map(i => i.product_id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('name');
    const productMap = products.reduce((acc, p) => { acc[p._id.toString()] = p.name; return acc; }, {});

    // Prepare items for bulk insert
    const itemsToInsert = itemsData.map(item => ({
      sales_id: salesId,
      product_id: item.product_id,
      product_name: item.product_name || productMap[item.product_id]?.toString() || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || (item.quantity * item.unit_price) || 0,
      discount: item.discount || 0,
      tax: item.tax || 0,
      amount_in_cash: item.amount_in_cash || 0,
      amount_in_ecash: item.amount_in_ecash || 0,
      notes: item.notes || ''
    }));

    // Insert all items
    const createdItems = await SalesItem.insertMany(itemsToInsert);

    // Return all items for this sale
    const items = await SalesItem.find({ sales_id: salesId })
      .populate('product_id', 'name category selling_price')
      .sort({ created_at: -1 });

    res.status(201).json({ msg: 'Sales items created successfully', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/sales-items/:itemId - update a sales item
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      quantity,
      unit_price,
      total_price,
      discount,
      tax,
      amount_in_cash,
      amount_in_ecash,
      notes
    } = req.body;

    const item = await SalesItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: 'Sales item not found' });
    }

    // Check authorization
    const sale = await Sales.findById(item.sales_id);
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this item' });
    }

    // Update fields
    if (quantity !== undefined) item.quantity = quantity;
    if (unit_price !== undefined) item.unit_price = unit_price;
    if (total_price !== undefined) item.total_price = total_price;
    if (discount !== undefined) item.discount = discount;
    if (tax !== undefined) item.tax = tax;
    if (amount_in_cash !== undefined) item.amount_in_cash = amount_in_cash;
    if (amount_in_ecash !== undefined) item.amount_in_ecash = amount_in_ecash;
    if (notes !== undefined) item.notes = notes;
    if (req.body.product_name !== undefined) item.product_name = req.body.product_name;

    await item.save();

    // Return all items for this sale
    const items = await SalesItem.find({ sales_id: item.sales_id })
      .populate('product_id', 'name category selling_price')
      .sort({ created_at: -1 });

    res.json({ msg: 'Sales item updated successfully', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/sales-items/:itemId - delete a sales item
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await SalesItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: 'Sales item not found' });
    }

    // Check authorization
    const sale = await Sales.findById(item.sales_id);
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this item' });
    }

    const salesId = item.sales_id;
    await item.deleteOne();

    // Return all items for this sale
    const items = await SalesItem.find({ sales_id: salesId })
      .populate('product_id', 'name category selling_price')
      .sort({ created_at: -1 });

    res.json({ msg: 'Sales item deleted successfully', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/sales-items/bulk/:salesId - delete all items for a sale
router.delete('/bulk/:salesId', auth, async (req, res) => {
  try {
    const { salesId } = req.params;

    // Find the sale and verify user has access
    const sale = await Sales.findById(salesId);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === sale.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete items from this sale' });
    }

    await SalesItem.deleteMany({ sales_id: salesId });

    res.json({ msg: 'All sales items deleted successfully', items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
