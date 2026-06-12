const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'syncpos_super_secret_jwt_key_9988', { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'syncpos_super_secret_jwt_key_9988', { expiresIn: '7d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.isActive && (await user.matchPassword(password))) {
      // Clear PIN lockout on successful standard login too
      user.failed_pin_attempts = 0;
      user.pin_locked_until = null;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    PIN login with lockout security
// @route   POST /api/auth/pin-login
// @access  Public
const pinLogin = async (req, res) => {
  const { pin } = req.body;
  try {
    const user = await User.findOne({ pin });
    
    // If PIN is not linked to any user, return invalid
    if (!user) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Check lockout
    if (user.pin_locked_until && user.pin_locked_until > new Date()) {
      const timeLeft = Math.ceil((user.pin_locked_until - new Date()) / 1000 / 60);
      return res.status(423).json({ message: `PIN login is locked. Try again in ${timeLeft} minutes.` });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'User is inactive' });
    }

    // Verify PIN (in this schema, PIN is stored in plain text or simple digits, so we check exact match)
    if (user.pin === pin) {
      // Clear failed attempts
      user.failed_pin_attempts = 0;
      user.pin_locked_until = null;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id)
      });
    } else {
      // Increment failed attempts
      user.failed_pin_attempts += 1;
      if (user.failed_pin_attempts >= 5) {
        user.pin_locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save();
      res.status(401).json({ 
        message: 'Invalid PIN', 
        attemptsLeft: Math.max(0, 5 - user.failed_pin_attempts) 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'syncpos_super_secret_jwt_key_9988');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    res.json({
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Incorrect current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, pinLogin, refreshToken, changePassword };
