const express = require('express');
const router = express.Router();
const { getWorkingHours, upsertWorkingHours } = require('../controllers/workingHoursController');
const { protect } = require('../middlewares/authMiddleware');

// Public (for frontend to know hours)
router.get('/', getWorkingHours);

// Admin only
router.post('/', protect, upsertWorkingHours);

module.exports = router;
