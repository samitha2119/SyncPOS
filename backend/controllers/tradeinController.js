const TradeIn = require('../models/TradeIn');
const Customer = require('../models/Customer');

// Helper to generate Trade-In ID
const generateTradeInId = async () => {
  const count = await TradeIn.countDocuments();
  return `TRD-${1000 + count + 1}`;
};

// @desc    Get all trade-ins
// @route   GET /api/tradeins
// @access  Private
const getTradeIns = async (req, res) => {
  try {
    const tradeins = await TradeIn.find().populate('customerId', 'name phone');
    res.json(tradeins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a trade-in valuation
// @route   POST /api/tradeins
// @access  Private
const createTradeIn = async (req, res) => {
  const { brand, model, condition, checklist, valuation, customerId, notes } = req.body;
  try {
    const tradeInId = await generateTradeInId();

    // Auto scoring: calculate valuation score based on condition if not manually set
    // E.g., check list score multiplier
    const passedCount = checklist.filter(c => c.passed).length;
    const scoreVal = valuation || (passedCount * 5000); // 5000 per checklist item passed

    const tradein = new TradeIn({
      tradeInId,
      brand,
      model,
      condition,
      checklist,
      valuation: scoreVal,
      customerId: customerId || null,
      notes
    });

    const saved = await tradein.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept trade-in and generate store credit
// @route   PATCH /api/tradeins/:id/accept
// @access  Private (Admin/Manager)
const acceptTradeIn = async (req, res) => {
  try {
    const tradein = await TradeIn.findById(req.params.id);
    if (!tradein) {
      return res.status(404).json({ message: 'Trade-in record not found' });
    }

    if (tradein.status !== 'Pending') {
      return res.status(400).json({ message: `Trade-in already ${tradein.status}` });
    }

    tradein.status = 'Accepted';
    tradein.creditGenerated = tradein.valuation;
    await tradein.save();

    // Attach valuation amount as loyalty points/credit (e.g. 1 point = 1 LKR) to customer
    if (tradein.customerId) {
      const customer = await Customer.findById(tradein.customerId);
      if (customer) {
        customer.loyaltyPoints += Math.floor(tradein.valuation / 10); // add credit points
        await customer.save();
      }
    }

    res.json(tradein);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel/Reject trade-in
// @route   PATCH /api/tradeins/:id/cancel
// @access  Private (Admin/Manager)
const rejectTradeIn = async (req, res) => {
  try {
    const tradein = await TradeIn.findById(req.params.id);
    if (!tradein) {
      return res.status(404).json({ message: 'Trade-in record not found' });
    }

    if (tradein.status !== 'Pending') {
      return res.status(400).json({ message: `Trade-in already ${tradein.status}` });
    }

    tradein.status = 'Rejected';
    await tradein.save();
    res.json(tradein);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTradeIns,
  createTradeIn,
  acceptTradeIn,
  rejectTradeIn
};
