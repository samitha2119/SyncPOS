const express = require('express');
const router = express.Router();
const { getTradeIns, createTradeIn, acceptTradeIn, rejectTradeIn } = require('../controllers/tradeinController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTradeIns)
  .post(protect, createTradeIn);

router.patch('/:id/accept', protect, authorize('Admin', 'Manager'), acceptTradeIn);
router.patch('/:id/cancel', protect, authorize('Admin', 'Manager'), rejectTradeIn);

module.exports = router;
