const express = require('express');
const router = express.Router();
const { openShift, closeShift, getCurrentShift } = require('../controllers/shiftController');
const { protect } = require('../middleware/authMiddleware');

router.post('/open', protect, openShift);
router.post('/:id/close', protect, closeShift);
router.get('/current', protect, getCurrentShift);

module.exports = router;
