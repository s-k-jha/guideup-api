const express = require('express');
const router = express.Router();
const { getSlots } = require('../controllers/slotController');

// Public: GET /api/slots?date=YYYY-MM-DD&sessionId=xxx
router.get('/', getSlots);

module.exports = router;
