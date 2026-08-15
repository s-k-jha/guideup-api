const express = require('express');
const router = express.Router();
const { getPublicArticles, getPublicArticleBySlug } = require('../controllers/articleController');

// Public
router.get('/', getPublicArticles);
router.get('/:slug', getPublicArticleBySlug);

module.exports = router;
