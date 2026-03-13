const express = require('express');
const router = express.Router();
const { getBookings, assignMentor } = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// Admin protected
router.get('/', protect, getBookings);
router.patch('/:id/assign-mentor', protect, assignMentor);

module.exports = router;
