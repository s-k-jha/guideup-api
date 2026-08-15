const express = require('express');
const router = express.Router();
const { getPublicMentors, getPublicMentorBySlug } = require('../controllers/publicMentorController');

// Public
router.get('/', getPublicMentors);
router.get('/:slug', getPublicMentorBySlug);

module.exports = router;
