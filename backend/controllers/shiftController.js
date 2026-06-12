const Shift = require('../models/Shift');
const Sale = require('../models/Sale');

// @desc    Open a new shift
// @route   POST /api/shifts/open
// @access  Private
const openShift = async (req, res) => {
  const { openingFloat } = req.body;
  try {
    // Check if there is already an open shift for this cashier
    const existing = await Shift.findOne({ cashierId: req.user._id, status: 'Open' });
    if (existing) {
      return res.status(400).json({ message: 'You already have an open shift. Close it first.' });
    }

    const shift = new Shift({
      cashierId: req.user._id,
      openingFloat,
      expectedCash: openingFloat // starts with opening float
    });

    const saved = await shift.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close active shift
// @route   POST /api/shifts/:id/close
// @access  Private
const closeShift = async (req, res) => {
  const { actualCash } = req.body;
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift || shift.status === 'Closed') {
      return res.status(404).json({ message: 'Active shift not found' });
    }

    shift.actualCash = actualCash;
    shift.variance = actualCash - shift.expectedCash;
    shift.status = 'Closed';
    shift.endTime = new Date();

    const saved = await shift.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current open shift for user
// @route   GET /api/shifts/current
// @access  Private
const getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ cashierId: req.user._id, status: 'Open' });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { openShift, closeShift, getCurrentShift };
