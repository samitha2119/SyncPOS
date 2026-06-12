const express = require('express');
const router = express.Router();
const { getHPAgreements, createHPAgreement, payInstallment } = require('../controllers/hpController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getHPAgreements)
  .post(protect, createHPAgreement);

router.post('/:id/pay', protect, payInstallment);

module.exports = router;
