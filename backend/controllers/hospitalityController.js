const TableOrder = require('../models/TableOrder');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Shift = require('../models/Shift');

// Helper to generate custom active order ID
const generateActiveOrderId = () => {
  return `ORD-${Date.now()}`;
};

// @desc    Get all tables
// @route   GET /api/hospitality/tables
// @access  Private
const getTables = async (req, res) => {
  try {
    const tables = await TableOrder.find();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a table
// @route   POST /api/hospitality/tables
// @access  Private (Admin/Manager)
const createTable = async (req, res) => {
  const { tableNumber } = req.body;
  try {
    const tableExists = await TableOrder.findOne({ tableNumber });
    if (tableExists) {
      return res.status(400).json({ message: 'Table already exists' });
    }
    const table = new TableOrder({ tableNumber });
    const saved = await table.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a table
// @route   DELETE /api/hospitality/tables/:id
// @access  Private (Admin/Manager)
const deleteTable = async (req, res) => {
  try {
    const table = await TableOrder.findById(req.params.id);
    if (table) {
      await TableOrder.deleteOne({ _id: table._id });
      res.json({ message: 'Table removed' });
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Order/Add items to table
// @route   POST /api/hospitality/tables/:id/order
// @access  Private
const orderItems = async (req, res) => {
  const { items, customerId } = req.body; // Array of { productId, name, quantity, price }
  try {
    const table = await TableOrder.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status === 'Available') {
      table.status = 'Occupied';
      table.activeOrderId = generateActiveOrderId();
      table.items = [];
    }

    if (customerId) {
      table.customerId = customerId;
    }

    // Append new items
    items.forEach(item => {
      table.items.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        status: 'Pending'
      });
    });

    const updatedTable = await table.save();

    // Socket notify KDS
    const io = req.app.get('socketio');
    if (io) {
      io.emit('kdsUpdate', { orderId: table.activeOrderId });
      io.emit('order:update', updatedTable);
    }

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update item preparation status (KDS kitchen dispatch)
// @route   PATCH /api/hospitality/tables/:id/items/:itemId
// @access  Private
const updateItemStatus = async (req, res) => {
  const { status } = req.body; // Pending / Sent / Served / Cancelled
  try {
    const table = await TableOrder.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const item = table.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    item.status = status;
    const updatedTable = await table.save();

    // Socket trigger
    const io = req.app.get('socketio');
    if (io) {
      io.emit('kdsUpdate', { orderId: table.activeOrderId });
      io.emit('order:update', updatedTable);
    }

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close order and checkout table (generates POS Sale)
// @route   POST /api/hospitality/tables/:id/checkout
// @access  Private
const closeOrderAndBill = async (req, res) => {
  const { payments, discount, vat, sscl, shiftId } = req.body;
  try {
    const table = await TableOrder.findById(req.params.id);
    if (!table || table.status === 'Available') {
      return res.status(400).json({ message: 'Table has no active order' });
    }

    const activeShift = await Shift.findById(shiftId);
    if (!activeShift || activeShift.status !== 'Open') {
      return res.status(400).json({ message: 'Must have an active open shift to check out' });
    }

    // Filter cancelled items from bill
    const activeItems = table.items.filter(item => item.status !== 'Cancelled');
    if (activeItems.length === 0) {
      return res.status(400).json({ message: 'No active items to checkout' });
    }

    const totalAmount = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const grandTotal = totalAmount + (vat || 0) + (sscl || 0) - (discount || 0);

    // Generate POS Sale Invoice Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const saleCount = await Sale.countDocuments();
    const invoiceNumber = `INV-HOSP-${dateStr}-${String(saleCount + 1).padStart(5, '0')}`;

    const saleItems = [];

    // Deduct inventory stock
    for (const item of activeItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.movements.push({
          type: 'OUT',
          quantity: item.quantity,
          reason: `Hospitality checkout ${invoiceNumber} (Table ${table.tableNumber})`
        });
        await product.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        }
      }

      saleItems.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        costPrice: product ? product.costPrice : item.price * 0.6, // fallback cost
        subtotal: item.price * item.quantity
      });
    }

    // Create POS Sale record
    const sale = new Sale({
      invoiceNumber,
      items: saleItems,
      customerId: table.customerId || null,
      cashierId: req.user._id,
      totalAmount,
      vat: vat || 0,
      sscl: sscl || 0,
      discount: discount || 0,
      grandTotal,
      payments,
      shiftId
    });

    const savedSale = await sale.save();

    // Update Shift calculations
    activeShift.salesCount += 1;
    const cashPaid = payments
      .filter(p => p.method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
    activeShift.expectedCash += cashPaid;
    activeShift.totalSalesAmount += grandTotal;
    await activeShift.save();

    // Reset Table state
    table.status = 'Available';
    table.items = [];
    table.activeOrderId = null;
    table.customerId = null;
    await table.save();

    // Socket notification
    const io = req.app.get('socketio');
    if (io) {
      io.emit('kdsUpdate', {});
      io.emit('order:update', table);
      io.emit('dashboardUpdate', {});
      io.emit('sale:new', { branchId: 'main', total: grandTotal });
    }

    res.json({ message: 'Table check out successful', sale: savedSale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTables,
  createTable,
  deleteTable,
  orderItems,
  updateItemStatus,
  closeOrderAndBill
};
