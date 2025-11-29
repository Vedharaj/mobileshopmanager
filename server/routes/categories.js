const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');
const Shop = require('../models/Shop');

// GET /api/categories - return authenticated user's categories (from their shops)
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);

    const categories = await Category.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name');

    res.json({ categories: categories || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/categories - create a new category
router.post('/', auth, async (req, res) => {
  try {
    const { name, shop_id } = req.body;

    if (!name || !shop_id) {
      return res.status(400).json({ msg: 'Name and shop_id are required' });
    }

    // Check if shop exists and belongs to the authenticated user
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(userShopId => userShopId.toString() === shop_id)) {
      return res.status(404).json({ msg: 'Shop not found or you don\'t have access to it' });
    }

    const category = new Category({
      name,
      shop_id
    });

    await category.save();

    // Return all categories for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const categories = await Category.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name');

    res.status(201).json({ msg: 'Category created successfully', categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/categories/:id - update a category
router.put('/:id', auth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    // Check if the authenticated user has access to this category's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === category.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this category' });
    }

    category.name = name;
    await category.save();

    // Return all categories for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const categories = await Category.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name');

    res.status(200).json({ msg: 'Category updated successfully', categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/categories/:id - delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    // Check if the authenticated user has access to this category's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === category.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to delete this category' });
    }

    await category.deleteOne();

    // Return all categories for user's shops
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(shop => shop._id);
    const categories = await Category.find({
      shop_id: { $in: shopIds }
    }).populate('shop_id', 'name');

    res.status(200).json({ msg: 'Category deleted successfully', categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

