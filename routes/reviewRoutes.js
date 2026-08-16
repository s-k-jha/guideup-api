const express = require('express');
const router = express.Router();
const { submitReview, submitPlatformReview } = require('../controllers/reviewController');
const { protectUser } = require('../middlewares/userAuthMiddleware');

router.post('/', protectUser, submitReview);
router.post('/platform', protectUser, submitPlatformReview);

module.exports = router;
