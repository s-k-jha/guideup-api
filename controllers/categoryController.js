const Category = require('../models/Category');
const Article = require('../models/Article');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return successResponse(res, { categories });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Name is required', 400);
    }

    const category = await Category.create({ name, slug, description });
    return successResponse(res, { category }, 'Category created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Category with this name or slug already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, { category }, 'Category updated');
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Category with this name or slug already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return errorResponse(res, 'Category not found', 404);

    const articleCount = await Article.countDocuments({ categoryId: category._id });
    if (articleCount > 0) {
      return errorResponse(
        res,
        `Cannot delete category: ${articleCount} article(s) reference it`,
        400
      );
    }

    await category.deleteOne();
    return successResponse(res, {}, 'Category deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
