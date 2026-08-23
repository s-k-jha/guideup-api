const express = require('express');
const router = express.Router();
const { getAdminNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', protect, getAdminNotes);
router.post('/', protect, upload.single('file'), createNote);
router.put('/:id', protect, upload.single('file'), updateNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;
