const Article = require('../models/Article');
const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const ALLOWED_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'coverImageUrl',
  'content',
  'categoryId',
  'tags',
  'authorName',
  'authorTitle',
  'status',
  'scheduledFor',
  'seoTitle',
  'seoDescription',
  'canonicalUrl',
];

const getPublicArticles = async (req, res) => {
  try {
    const { category, tag, search } = req.query;
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 12;
    if (page < 1) page = 1;
    if (limit < 1) limit = 12;
    if (limit > 50) limit = 50;

    const filter = { status: 'published' };

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (!categoryDoc) {
        return successResponse(res, { articles: [], page, totalPages: 0, total: 0 });
      }
      filter.categoryId = categoryDoc._id;
    }

    if (tag) filter.tags = tag;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await Article.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const articles = await Article.find(filter)
      .populate('categoryId', 'name slug')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return successResponse(res, { articles, page, totalPages, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getPublicArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: 'published',
    }).populate('categoryId', 'name slug');

    if (!article) return errorResponse(res, 'Article not found', 404);

    let relatedArticles = [];
    if (article.categoryId) {
      relatedArticles = await Article.find({
        categoryId: article.categoryId,
        status: 'published',
        _id: { $ne: article._id },
      })
        .select('title slug excerpt coverImageUrl')
        .limit(3);
    }

    return successResponse(res, { article, relatedArticles });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getAdminArticles = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const articles = await Article.find(filter)
      .populate('categoryId', 'name')
      .sort({ updatedAt: -1 });

    return successResponse(res, { articles });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getAdminArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('categoryId', 'name');
    if (!article) return errorResponse(res, 'Article not found', 404);
    return successResponse(res, { article });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !title.trim()) return errorResponse(res, 'Title is required', 400);
    if (!content) return errorResponse(res, 'Content is required', 400);

    const payload = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    const article = await Article.create(payload);
    return successResponse(res, { article }, 'Article created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Article with this slug already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);

    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) article[field] = req.body[field];
    });

    await article.save();
    return successResponse(res, { article }, 'Article updated');
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Article with this slug already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);
    return successResponse(res, {}, 'Article deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const publishArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);

    article.status = 'published';
    await article.save();

    return successResponse(res, { article }, 'Article published');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const unpublishArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);

    article.status = 'draft';
    await article.save();

    return successResponse(res, { article }, 'Article unpublished');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getPublicArticles,
  getPublicArticleBySlug,
  getAdminArticles,
  getAdminArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
};
