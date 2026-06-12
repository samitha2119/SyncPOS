const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Shift = require('../models/Shift');

// Helper to generate Invoice Number (e.g., INV-2026-0001)
const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments();
  const nextNum = String(count + 1).padStart(5, '0');
  return `INV-${dateStr}-${nextNum}`;
};

// @desc    Create a new POS sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  const { items, customerId, totalAmount, vat, sscl, discount, grandTotal, payments, shiftId } = req.body;
  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in checkout' });
    }

    // Verify shift is open
    const shift = await Shift.findById(shiftId);
    if (!shift || shift.status !== 'Open') {
      return res.status(400).json({ message: 'Must have an active open shift to check out' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const finalItems = [];

    // Deduct stock and compile final items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      // Deduct stock
      product.stock -= item.quantity;
      product.movements.push({
        type: 'OUT',
        quantity: item.quantity,
        reason: `Checkout ${invoiceNumber}`
      });

      await product.save();

      // Emit stock update
      const io = req.app.get('socketio');
      if (io) {
        io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        if (product.stock <= product.minStock) {
          io.emit('notificationUpdate', { type: 'Low Stock', message: `${product.name} is running low on stock!` });
        }
      }

      finalItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        costPrice: product.costPrice,
        subtotal: item.price * item.quantity
      });
    }

    // Process Customer Loyalty Points (1 point for every LKR 100 spent)
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        const pointsEarned = Math.floor(grandTotal / 100);
        customer.loyaltyPoints += pointsEarned;
        await customer.save();
      }
    }

    // Create the Sale
    const sale = new Sale({
      invoiceNumber,
      items: finalItems,
      customerId: customerId || null,
      cashierId: req.user._id,
      totalAmount,
      vat,
      sscl,
      discount,
      grandTotal,
      payments,
      shiftId
    });

    const savedSale = await sale.save();

    // Update Shift Stats
    shift.salesCount += 1;
    // Calculate total cash in payments
    const cashPaid = payments
      .filter(p => p.method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
    shift.expectedCash += cashPaid;
    shift.totalSalesAmount += grandTotal;
    await shift.save();

    // Socket Emit
    const io = req.app.get('socketio');
    if (io) {
      io.emit('sale:new', { branchId: 'main', total: grandTotal });
      io.emit('dashboardUpdate', {});
    }

    res.status(201).json(savedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refund a sale (full/partial)
// @route   POST /api/sales/:id/refund
// @access  Private
const refundSale = async (req, res) => {
  const { reason } = req.body;
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.status === 'Refunded') {
      return res.status(400).json({ message: 'Sale is already refunded' });
    }

    sale.status = 'Refunded';
    sale.refundReason = reason || 'Customer refund request';
    await sale.save();

    // Put stock back
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        product.movements.push({
          type: 'IN',
          quantity: item.quantity,
          reason: `Refund for invoice ${sale.invoiceNumber}`
        });
        await product.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        }
      }
    }

    // Deduct expected cash from active shift if refund is paid in Cash
    const cashPaid = sale.payments
      .filter(p => p.method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
      
    if (cashPaid > 0) {
      const activeShift = await Shift.findOne({ status: 'Open' });
      if (activeShift) {
        activeShift.expectedCash = Math.max(activeShift.openingFloat, activeShift.expectedCash - cashPaid);
        await activeShift.save();
      }
    }

    // Deduct loyalty points if applicable
    if (sale.customerId) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        const pointsDeducted = Math.floor(sale.grandTotal / 100);
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - pointsDeducted);
        await customer.save();
      }
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('dashboardUpdate', {});
    }

    res.json({ message: 'Sale refunded successfully', sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Void a sale (Admin/Manager only)
// @route   POST /api/sales/:id/void
// @access  Private (Admin/Manager)
const voidSale = async (req, res) => {
  const { reason } = req.body;
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.status === 'Voided') {
      return res.status(400).json({ message: 'Sale is already voided' });
    }

    sale.status = 'Voided';
    sale.voidReason = reason || 'Manager void request';
    await sale.save();

    // Restock the voided products
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        product.movements.push({
          type: 'IN',
          quantity: item.quantity,
          reason: `Voided sale ${sale.invoiceNumber}`
        });
        await product.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('inventory:update', { productId: product._id, newStock: product.stock });
        }
      }
    }

    // Deduct expected cash from active shift if voided sale had Cash payments
    const cashPaid = sale.payments
      .filter(p => p.method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);

    if (cashPaid > 0) {
      const activeShift = await Shift.findOne({ status: 'Open' });
      if (activeShift) {
        activeShift.expectedCash = Math.max(activeShift.openingFloat, activeShift.expectedCash - cashPaid);
        await activeShift.save();
      }
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('dashboardUpdate', {});
    }

    res.json({ message: 'Sale voided successfully', sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Sales history
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  const { from, to, cashier, paymentStatus } = req.query;
  let query = {};

  if (from && to) {
    query.createdAt = {
      $gte: new Date(new Date(from).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(to).setHours(23, 59, 59, 999))
    };
  }

  if (cashier) {
    query.cashierId = cashier;
  }

  if (paymentStatus) {
    query.status = paymentStatus;
  }

  try {
    const sales = await Sale.find(query)
      .populate('cashierId', 'name')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashierId', 'name')
      .populate('customerId', 'name');
    if (sale) {
      res.json(sale);
    } else {
      res.status(404).json({ message: 'Sale not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSale,
  refundSale,
  voidSale,
  getSales,
  getSaleById
};
