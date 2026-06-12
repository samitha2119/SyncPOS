const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shift = require('../models/Shift');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total revenue & sales count this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const salesStats = await Sale.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = salesStats.length > 0 ? salesStats[0].totalRevenue : 0;
    const salesCount = salesStats.length > 0 ? salesStats[0].count : 0;

    // 2. Low stock count
    const lowStockCount = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    // 3. Open shift status
    const openShift = await Shift.findOne({ status: 'Open' }).populate('cashierId', 'name');

    res.json({
      revenue,
      salesCount,
      lowStockCount,
      openShift: openShift ? { id: openShift._id, cashier: openShift.cashierId.name, startTime: openShift.startTime } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top 10 selling products
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const topProducts = await Sale.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get 7-day sales trend
// @route   GET /api/dashboard/sales-trend
// @access  Private
const getSalesTrend = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const trend = await Sale.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for Recharts compatibility
    const formatted = trend.map(t => ({
      date: t._id,
      sales: t.totalSales,
      orders: t.count
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getTopProducts,
  getSalesTrend
};
