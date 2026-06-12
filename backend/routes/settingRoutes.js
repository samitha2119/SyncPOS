const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('Admin', 'Manager'), updateSettings);

module.exports = router;
