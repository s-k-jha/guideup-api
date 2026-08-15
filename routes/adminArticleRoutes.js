const express = require('express');
const router = express.Router();
const {
  getAdminArticles,
  getAdminArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
} = require('../controllers/articleController');
const { protect } = require('../middlewares/authMiddleware');

// All admin protected
router.get('/', protect, getAdminArticles);
router.get('/:id', protect, getAdminArticleById);
router.post('/', protect, createArticle);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);
router.patch('/:id/publish', protect, publishArticle);
router.patch('/:id/unpublish', protect, unpublishArticle);

module.exports = router;
