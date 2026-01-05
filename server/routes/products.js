const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Category = require('../models/Category');

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

// POST /api/products/bulk-import - import multiple products from CSV (MUST BE BEFORE GENERIC POST)
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ msg: 'Products array is required' });
    }

    // console.log(`📦 Starting bulk import of ${products.length} products...`);

    const importedProducts = [];
    const skippedProducts = [];
    const errors = [];
    const BATCH_SIZE = 10; // Process 10 products at a time
    const BATCH_DELAY = 100; // Wait 100ms between batches

    // Validate user has access to shops
    const user = await req.user.populate('shops');
    const userShopIds = user.shops.map(shop => shop._id.toString());

    // Process in batches
    for (let batchStart = 0; batchStart < products.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, products.length);
      const batch = products.slice(batchStart, batchEnd);
      
      // console.log(`🔄 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)} (${batchStart + 1}-${batchEnd} of ${products.length})`);

      // Process batch items
      for (let i = 0; i < batch.length; i++) {
        const globalIndex = batchStart + i;
        const productData = batch[i];
        
        try {
          // Validate mandatory fields
          if (!productData.name || !productData.shop_id) {
            errors.push(`Product ${globalIndex + 1}: Missing name or shop_id`);
            continue;
          }

          // Verify user has access to the shop
          if (!userShopIds.includes(productData.shop_id.toString())) {
            errors.push(`Product ${globalIndex + 1}: No access to shop`);
            continue;
          }

          // Check if product with same name already exists in the shop
          const existingProduct = await Product.findOne({
            name: productData.name,
            shop_id: productData.shop_id
          });

          if (existingProduct) {
            skippedProducts.push({
              index: globalIndex + 1,
              name: productData.name,
              reason: 'Product with same name already exists in shop'
            });
            // console.log(`⏭️  [${globalIndex + 1}/${products.length}] Skipped duplicate: ${productData.name}`);
            continue;
          }

          // If category name is provided but no ID, create category
          if (productData.category_name && !productData.category_id) {
            let category = await Category.findOne({
              name: productData.category_name,
              shop_id: productData.shop_id
            });

            if (!category) {
              category = new Category({
                name: productData.category_name,
                shop_id: productData.shop_id,
                user_id: req.user._id
              });
              await category.save();
              // console.log(`✅ Created category: ${productData.category_name}`);
            }

            productData.category_id = category._id;
          }

          // Create product
          const product = new Product({
            shop_id: productData.shop_id,
            user_id: productData.user_id || req.user._id,
            category_id: productData.category_id || null,
            customer_id: null, // Always null per requirement
            name: productData.name,
            qty: parseInt(productData.qty) || 0,
            cost_price: parseInt(productData.cost_price) || 0,
            selling_price: parseInt(productData.selling_price) || 0,
            cgst: parseInt(productData.cgst) || 0,
            sgst: parseInt(productData.sgst) || 0,
            minimum_stock: parseInt(productData.minimum_stock) || 0,
            date: productData.date ? new Date(productData.date) : new Date(),
            note: productData.note || '',
            created_at: new Date(),
            updated_at: new Date()
          });

          await product.save();
          importedProducts.push(product);
          // console.log(`✅ [${globalIndex + 1}/${products.length}] Imported: ${product.name} (${product.barcode})`);
        } catch (err) {
          // console.error(`❌ Error importing product ${globalIndex + 1}:`, err.message);
          errors.push(`Product ${globalIndex + 1}: ${err.message}`);
        }
      }

      // Wait between batches (except for the last batch)
      if (batchEnd < products.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    // console.log(`✅ Bulk import completed: ${importedProducts.length}/${products.length} products imported`);
    // if (skippedProducts.length > 0) {
    //   console.log(`⏭️  Skipped ${skippedProducts.length} duplicate products`);
    // }

    // Return results
    const response = {
      msg: 'Bulk import completed',
      imported: importedProducts.length,
      skipped: skippedProducts.length,
      total: products.length,
      skippedDetails: skippedProducts.length > 0 ? skippedProducts : undefined,
      errors: errors.length > 0 ? errors : undefined
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('❌ Bulk import error:', err);
    res.status(500).json({ msg: 'Server error during bulk import', error: err.message });
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

// PATCH /api/products/:id/increment - increment product quantity
router.patch('/:id/increment', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { amount = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    // Check if the authenticated user has access to this product's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === product.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this product' });
    }
    product.qty = (parseInt(product.qty) || 0) + Math.abs(parseInt(amount) || 1);
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
    res.status(200).json({ msg: 'Product quantity incremented', products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/products/:id/decrement - decrement product quantity
router.patch('/:id/decrement', auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { amount = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    // Check if the authenticated user has access to this product's shop
    const isOwnerOfShop = req.user.shops.some(shopId => shopId.toString() === product.shop_id.toString());
    if (!isOwnerOfShop) {
      return res.status(403).json({ msg: 'Unauthorized: Not authorized to update this product' });
    }
    product.qty = Math.max(0, (parseInt(product.qty) || 0) - Math.abs(parseInt(amount) || 1));
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
    res.status(200).json({ msg: 'Product quantity decremented', products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

