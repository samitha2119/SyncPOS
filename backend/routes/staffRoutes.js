const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, resetPIN } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('Admin', 'Manager'), getStaff)
  .post(protect, authorize('Admin', 'Manager'), createStaff);

router.route('/:id')
  .put(protect, authorize('Admin', 'Manager'), updateStaff);

router.patch('/:id/reset-pin', protect, authorize('Admin', 'Manager'), resetPIN);

module.exports = router;
