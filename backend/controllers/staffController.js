const User = require('../models/User');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Admin/Manager)
const getStaff = async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  try {
    const staff = await User.find(query).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new staff member
// @route   POST /api/staff
// @access  Private (Admin/Manager)
const createStaff = async (req, res) => {
  const { name, email, password, pin, role } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existsPin = await User.findOne({ pin });
    if (existsPin) {
      return res.status(400).json({ message: 'This PIN is already assigned to another user' });
    }

    const user = new User({ name, email, password, pin, role });
    const saved = await user.save();
    res.status(201).json({
      _id: saved._id,
      name: saved.name,
      email: saved.email,
      role: saved.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff member details
// @route   PUT /api/staff/:id
// @access  Private (Admin/Manager)
const updateStaff = async (req, res) => {
  const { name, email, role, isActive } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      if (isActive !== undefined) {
        user.isActive = isActive;
      }

      const updated = await user.save();
      res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive
      });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset staff PIN
// @route   PATCH /api/staff/:id/reset-pin
// @access  Private (Admin/Manager)
const resetPIN = async (req, res) => {
  const { pin } = req.body;
  try {
    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    const pinExists = await User.findOne({ pin });
    if (pinExists) {
      return res.status(400).json({ message: 'PIN is already in use by another user' });
    }

    const user = await User.findById(req.params.id);
    if (user) {
      user.pin = pin;
      user.failed_pin_attempts = 0;
      user.pin_locked_until = null;
      await user.save();
      res.json({ message: 'PIN reset successfully' });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  resetPIN
};
