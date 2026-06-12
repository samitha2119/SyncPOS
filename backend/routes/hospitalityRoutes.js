const express = require('express');
const router = express.Router();
const {
  getTables,
  createTable,
  deleteTable,
  orderItems,
  updateItemStatus,
  closeOrderAndBill
} = require('../controllers/hospitalityController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/tables')
  .get(protect, getTables)
  .post(protect, authorize('Admin', 'Manager'), createTable);

router.delete('/tables/:id', protect, authorize('Admin', 'Manager'), deleteTable);
router.post('/tables/:id/order', protect, orderItems);
router.patch('/tables/:id/items/:itemId', protect, updateItemStatus);
router.post('/tables/:id/checkout', protect, closeOrderAndBill);

module.exports = router;
