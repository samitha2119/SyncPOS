const express = require('express');
const router = express.Router();
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepairStatus,
  assignTechnician
} = require('../controllers/repairController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRepairs)
  .post(protect, createRepair);

router.route('/:id')
  .get(protect, getRepairById);

router.patch('/:id/status', protect, updateRepairStatus);
router.patch('/:id/assign', protect, authorize('Admin', 'Manager'), assignTechnician);

module.exports = router;
