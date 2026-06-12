const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockMovements,
  checkExpiries,
  addBatch
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('Admin', 'Manager'), createProduct);

router.get('/check-expiries', protect, checkExpiries);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('Admin', 'Manager'), updateProduct)
  .delete(protect, authorize('Admin', 'Manager'), deleteProduct);

router.post('/:id/adjust-stock', protect, authorize('Admin', 'Manager'), adjustStock);
router.get('/:id/movements', protect, getStockMovements);
router.post('/:id/batches', protect, authorize('Admin', 'Manager'), addBatch);

module.exports = router;
