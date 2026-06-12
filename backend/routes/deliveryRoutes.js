const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus,
  assignDriver
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getDeliveries)
  .post(protect, createDelivery);

router.patch('/:id/status', protect, updateDeliveryStatus);
router.patch('/:id/assign', protect, authorize('Admin', 'Manager'), assignDriver);

module.exports = router;
