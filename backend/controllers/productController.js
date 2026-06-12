const Product = require('../models/Product');

// @desc    Get all products (filtered)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  const { search, category, lowStock, businessType } = req.query;
  let query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (businessType) {
    query.businessType = businessType;
  }

  try {
    let products = await Product.find(query);

    if (lowStock === 'true') {
      products = products.filter(p => p.stock <= p.minStock);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.isActive) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Manager)
const createProduct = async (req, res) => {
  const { name, barcode, price, costPrice, stock, minStock, brand, category, businessType } = req.body;
  try {
    const productExists = await Product.findOne({ barcode });
    if (productExists && barcode) {
      return res.status(400).json({ message: 'Product with this barcode already exists' });
    }

    const product = new Product({
      name,
      barcode,
      price,
      costPrice,
      stock,
      minStock,
      brand,
      category,
      businessType
    });

    if (stock > 0) {
      product.movements.push({
        type: 'IN',
        quantity: stock,
        reason: 'Initial Stock setup'
      });
    }

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager)
const updateProduct = async (req, res) => {
  const { name, barcode, price, costPrice, minStock, brand, category, businessType } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.barcode = barcode || product.barcode;
      product.price = price !== undefined ? price : product.price;
      product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
      product.minStock = minStock !== undefined ? minStock : product.minStock;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.businessType = businessType || product.businessType;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Manager)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isActive = false;
      await product.save();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Adjust stock level manually
// @route   POST /api/products/:id/adjust-stock
// @access  Private (Admin/Manager)
const adjustStock = async (req, res) => {
  const { quantity, reason, type } = req.body; // type: IN or OUT or ADJUSTMENT
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const parsedQty = parseInt(quantity, 10);
      let stockChange = parsedQty;
      
      if (type === 'OUT') stockChange = -Math.abs(parsedQty);
      if (type === 'IN') stockChange = Math.abs(parsedQty);

      product.stock += stockChange;
      product.movements.push({
        type: type || 'ADJUSTMENT',
        quantity: parsedQty,
        reason: reason || 'Manual adjustment'
      });

      const updated = await product.save();

      // Socket Emit trigger
      const io = req.app.get('socketio');
      if (io) {
        io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        io.emit('dashboardUpdate', {});
        if (product.stock <= product.minStock) {
          io.emit('notificationUpdate', { type: 'Low Stock', message: `${product.name} is low in stock.` });
        }
      }

      res.json(updated);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock movements for a product
// @route   GET /api/products/:id/movements
// @access  Private
const getStockMovements = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product.movements);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check expiring batches (within 30 days or expired)
// @route   GET /api/products/check-expiries
// @access  Private
const checkExpiries = async (req, res) => {
  try {
    const products = await Product.find({ 'batches.expiryDate': { $exists: true }, isActive: true });
    const warnings = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    products.forEach(product => {
      product.batches.forEach(batch => {
        if (new Date(batch.expiryDate) <= thirtyDaysFromNow) {
          warnings.push({
            productId: product._id,
            productName: product.name,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            isExpired: new Date(batch.expiryDate) <= now
          });
        }
      });
    });

    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a batch to product
// @route   POST /api/products/:id/batches
// @access  Private (Admin/Manager)
const addBatch = async (req, res) => {
  const { batchNumber, expiryDate, quantity } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const qty = parseInt(quantity, 10);
      product.batches.push({ batchNumber, expiryDate, quantity: qty });
      
      // Auto-increment main stock
      product.stock += qty;
      product.movements.push({
        type: 'IN',
        quantity: qty,
        reason: `New batch ${batchNumber} added`
      });

      await product.save();

      // Emit updates
      const io = req.app.get('socketio');
      if (io) {
        io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        io.emit('dashboardUpdate', {});
      }

      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockMovements,
  checkExpiries,
  addBatch
};
