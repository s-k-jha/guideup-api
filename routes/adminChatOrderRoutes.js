const express = require('express');
const router = express.Router();
const { getAdminChatOrders } = require('../controllers/chatOrderController');
const { protect } = require('../middlewares/authMiddleware');

// Admin protected
router.get('/', protect, getAdminChatOrders);

module.exports = router;
