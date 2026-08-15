const express = require('express');
const router = express.Router();
const { getSitemapData } = require('../controllers/sitemapController');

// Public
router.get('/', getSitemapData);

module.exports = router;
