const HirePurchase = require('../models/HirePurchase');
const Product = require('../models/Product');

// Helper to generate HP ID
const generateHpId = async () => {
  const count = await HirePurchase.countDocuments();
  return `HP-${1000 + count + 1}`;
};

// @desc    Get all Hire Purchase agreements
// @route   GET /api/hp
// @access  Private
const getHPAgreements = async (req, res) => {
  const { status, search } = req.query;
  let query = {};
  if (status) {
    query.status = status;
  }
  try {
    let agreements = await HirePurchase.find(query)
      .populate('customerId', 'name phone nic')
      .populate('productId', 'name price');

    if (search) {
      agreements = agreements.filter(ag => {
        return (
          ag.customerId.name.toLowerCase().includes(search.toLowerCase()) ||
          ag.customerId.nic.toLowerCase().includes(search.toLowerCase()) ||
          ag.hpId.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    // Proactively check overdue statuses on retrieval
    const now = new Date();
    let updatedNeeded = false;
    agreements.forEach(ag => {
      ag.installments.forEach(inst => {
        if (inst.dueDate < now && inst.status === 'Pending') {
          inst.status = 'Overdue';
          updatedNeeded = true;
        }
      });
    });

    if (updatedNeeded) {
      // Save agreements in background
      for (const ag of agreements) {
        await ag.save();
      }
    }

    res.json(agreements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Hire Purchase agreement
// @route   POST /api/hp
// @access  Private
const createHPAgreement = async (req, res) => {
  const { customerId, productId, totalPrice, downPayment, interestRate, months } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const principal = totalPrice - downPayment;
    const totalWithInterest = principal * (1 + (interestRate || 0) / 100);
    const remainingBalance = totalWithInterest;

    const hpId = await generateHpId();
    const installments = [];
    const monthlyAmount = totalWithInterest / months;

    // Generate monthly installment dates
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        dueDate,
        amount: monthlyAmount,
        paidAmount: 0,
        status: 'Pending'
      });
    }

    const hp = new HirePurchase({
      hpId,
      customerId,
      productId,
      totalPrice,
      downPayment,
      remainingBalance,
      interestRate,
      installments,
      status: 'Active'
    });

    // Deduct stock of the product being purchased
    product.stock = Math.max(0, product.stock - 1);
    product.movements.push({
      type: 'OUT',
      quantity: 1,
      reason: `HP Agreement Setup ${hpId}`
    });
    await product.save();

    const saved = await hp.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('inventory:update', { productId: product._id, newStock: product.stock });
      io.emit('dashboardUpdate', {});
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay installment
// @route   POST /api/hp/:id/pay
// @access  Private
const payInstallment = async (req, res) => {
  const { installmentId, amount } = req.body;
  try {
    const hp = await HirePurchase.findById(req.params.id);
    if (!hp) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    const installment = hp.installments.id(installmentId);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const payVal = parseFloat(amount);
    installment.paidAmount += payVal;
    installment.paidDate = new Date();

    if (installment.paidAmount >= installment.amount) {
      installment.status = 'Paid';
    }

    // Deduct from remaining balance
    hp.remainingBalance = Math.max(0, hp.remainingBalance - payVal);

    // If fully paid, complete agreement
    const allPaid = hp.installments.every(inst => inst.status === 'Paid');
    if (allPaid || hp.remainingBalance === 0) {
      hp.status = 'Completed';
    }

    const updated = await hp.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHPAgreements,
  createHPAgreement,
  payInstallment
};
