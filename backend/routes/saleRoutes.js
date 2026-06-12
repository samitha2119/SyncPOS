const express = require('express');
const router = express.Router();
const { createSale, refundSale, voidSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSales)
  .post(protect, createSale);

router.route('/:id')
  .get(protect, getSaleById);

router.post('/:id/refund', protect, refundSale);
router.post('/:id/void', protect, authorize('Admin', 'Manager'), voidSale);

module.exports = router;
