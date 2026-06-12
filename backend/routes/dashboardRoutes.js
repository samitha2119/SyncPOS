const express = require('express');
const router = express.Router();
const { getDashboardStats, getTopProducts, getSalesTrend } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/top-products', protect, getTopProducts);
router.get('/sales-trend', protect, getSalesTrend);

module.exports = router;
