const express = require('express');
const router = express.Router();
const { login, pinLogin, refreshToken, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/pin-login', pinLogin);
router.post('/refresh', refreshToken);
router.patch('/change-password', protect, changePassword);

module.exports = router;
