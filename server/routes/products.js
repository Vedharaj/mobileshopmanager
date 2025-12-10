const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// GET /api/products - return authenticated user's products (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    const products = await Product.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('category_id', 'name')
      .populate('customer_id', 'name');

    res.json({ products: products || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/products - create a new product
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      shop_id,
      user_id,
      category_id,
      customer_id,
      qty,
      cost_price,
      selling_price,
      cgst,
      sgst,
      minimum_stock,
      date,
      note
    } = req.body;

    if (!name || !shop_id) {
      return res.status(400).json({ msg: 'Name and shop_id are required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(userShopId => userShopId.toString() === shop_id)) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    const product = new Product({
      name,
      shop_id,
      user_id: user_id || req.user._id,
      category_id: category_id || null,
      customer_id: customer_id || null,
      qty: qty || 0,
      cost_price: cost_price || 0,
      selling_price: selling_price || 0,
      cgst: cgst || 0,
      sgst: sgst || 0,
      minimum_stock: minimum_stock || 0,
      date: date ? new Date(date) : new Date(),
      note: note || ''
    });

    await product.save();

    // Return all products for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const products = await Product.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('category_id', 'name')
      .populate('customer_id', 'name');

    res.status(201).json({ msg: 'Product created successfully', products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/products/:id - update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      category_id,
      customer_id,
      qty,
      quantity,
      cost_price,
      selling_price,
      cgst,
      sgst,
      minimum_stock,
      date,
      note
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Check if the authenticated user has access to this product's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === product.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this product' });
    }

    // Allow partial updates - only update provided fields
    if (name !== undefined) product.name = name;
    if (category_id !== undefined) product.category_id = category_id || null;
    if (customer_id !== undefined) product.customer_id = customer_id || null;
    if (qty !== undefined) product.qty = qty || 0;
    if (quantity !== undefined) product.quantity = quantity || 0;
    if (cost_price !== undefined) product.cost_price = cost_price || 0;
    if (selling_price !== undefined) product.selling_price = selling_price || 0;
    if (cgst !== undefined) product.cgst = cgst || 0;
    if (sgst !== undefined) product.sgst = sgst || 0;
    if (minimum_stock !== undefined) product.minimum_stock = minimum_stock || 0;
    if (date !== undefined && date) {
      product.date = new Date(date);
    }
    if (note !== undefined) product.note = note || '';
    
    await product.save();

    // Return all products for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const products = await Product.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('category_id', 'name')
      .populate('customer_id', 'name');

    res.status(200).json({ msg: 'Product updated successfully', products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/products/:id - delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Check if the authenticated user has access to this product's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === product.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this product' });
    }

    await product.deleteOne();

    // Return all products for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const products = await Product.find({
      shop_id: { $in: shopIds }
    })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('category_id', 'name')
      .populate('customer_id', 'name');

    res.status(200).json({ msg: 'Product deleted successfully', products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

