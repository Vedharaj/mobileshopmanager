const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RequestItem = require('../models/RequestItem');
const Shop = require('../models/Shop');

// GET /api/request-items - list items for user's shops
router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(s => s._id);
    const items = await RequestItem.find({ shop_id: { $in: shopIds } })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('product_id', 'name');
    res.json({ items: items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/request-items - create a new request item
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, shop_id, qty, note } = req.body;
    if (!product_id || !shop_id || qty == null) {
      return res.status(400).json({ msg: 'product_id, shop_id and qty are required' });
    }

    // verify shop access
    const shop = await Shop.findById(shop_id);
    if (!shop || !req.user.shops.some(id => id.toString() === shop_id)) {
      return res.status(403).json({ msg: "Unauthorized: You don't have access to this shop" });
    }

    const item = new RequestItem({
      product_id,
      shop_id,
      qty: Number(qty) || 0,
      note: note || '',
      user_id: req.user._id,
      status: 'pending',
    });
    await item.save();

    // Emit socket event for new request item
    try {
      const { getIO } = require('../socket');
      const { sendPushToShop } = require('../utils/push');
      const populated = await item
        .populate('shop_id', 'name')
        .populate('user_id', 'username')
        .populate('product_id', 'name');
      getIO().to(`shop:${item.shop_id}`).emit('request:new', { request: populated });
      await sendPushToShop(item.shop_id, 'New Request', `${populated.product_id?.name || 'Product'} x ${populated.qty || ''}`.trim());
    } catch (e) {
      // Non-fatal if socket not initialized
    }

    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(s => s._id);
    const items = await RequestItem.find({ shop_id: { $in: shopIds } })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('product_id', 'name');
    res.status(201).json({ msg: 'Request created', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/request-items/:id - update existing request item
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { qty, note, status } = req.body;
    const item = await RequestItem.findById(id);
    if (!item) return res.status(404).json({ msg: 'Request item not found' });

    // ensure access to the shop
    const allowed = req.user.shops.some(sid => sid.toString() === item.shop_id.toString());
    if (!allowed) return res.status(403).json({ msg: 'Unauthorized' });

    if (qty != null) item.qty = Number(qty) || 0;
    if (note !== undefined) item.note = note || '';
    if (status) item.status = status;
    await item.save();

    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(s => s._id);
    const items = await RequestItem.find({ shop_id: { $in: shopIds } })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('product_id', 'name');
    res.json({ msg: 'Request updated', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/request-items/:id - delete request item
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RequestItem.findById(id);
    if (!item) return res.status(404).json({ msg: 'Request item not found' });

    const allowed = req.user.shops.some(sid => sid.toString() === item.shop_id.toString());
    if (!allowed) return res.status(403).json({ msg: 'Unauthorized' });

    await item.deleteOne();

    const user = await req.user.populate('shops');
    const shopIds = user.shops.map(s => s._id);
    const items = await RequestItem.find({ shop_id: { $in: shopIds } })
      .populate('shop_id', 'name')
      .populate('user_id', 'username')
      .populate('product_id', 'name');
    res.json({ msg: 'Request deleted', items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
