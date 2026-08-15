const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getApplications,
  updateApplicationStatus,
} = require('../controllers/mentorApplicationController');
const { protect } = require('../middlewares/authMiddleware');

// Public
router.post('/', submitApplication);

// Admin protected
router.get('/', protect, getApplications);
router.patch('/:id/status', protect, updateApplicationStatus);

module.exports = router;
