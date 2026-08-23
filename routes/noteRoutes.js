const express = require('express');
const router = express.Router();
const { getPublicNotes } = require('../controllers/noteController');
const { protectUser } = require('../middlewares/userAuthMiddleware');

// Students must be signed in to see notes
router.get('/', protectUser, getPublicNotes);

module.exports = router;
