const express = require('express');
const router = express.Router();
const { getAdminReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getAdminReviews);

module.exports = router;
