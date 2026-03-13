const express = require('express');
const router = express.Router();
const { getMentors, createMentor, updateMentor } = require('../controllers/mentorController');
const { protect } = require('../middlewares/authMiddleware');

// Admin protected
router.get('/', protect, getMentors);
router.post('/', protect, createMentor);
router.put('/:id', protect, updateMentor);

module.exports = router;
