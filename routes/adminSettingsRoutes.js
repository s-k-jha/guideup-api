const express = require('express');
const router = express.Router();
const { getAdminSettings, updateAdminSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getAdminSettings);
router.patch('/', protect, updateAdminSettings);

module.exports = router;
