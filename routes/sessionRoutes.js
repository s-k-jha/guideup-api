const express = require('express');
const router = express.Router();
const { getSessions, createSession, updateSession, deleteSession } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');
const { validateSession } = require('../middlewares/validate');

// Public
router.get('/', getSessions);

// Admin protected
router.post('/',protect, validateSession, createSession);
router.put('/:id', protect, validateSession, updateSession);
router.delete('/:id', protect, deleteSession);

module.exports = router;
