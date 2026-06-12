const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('cashierId', 'name');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { title, amount, category } = req.body;
  try {
    const expense = new Expense({
      title,
      amount,
      category,
      cashierId: req.user._id
    });
    const saved = await expense.save();

    // Trigger dashboard update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('dashboardUpdate', {});
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense };
