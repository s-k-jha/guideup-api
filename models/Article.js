const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    authorName: {
      type: String,
      default: 'GuideUp Team',
    },
    authorTitle: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'SEO title cannot exceed 70 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters'],
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    readingTimeMinutes: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });

articleSchema.pre('validate', async function (next) {
  if (!this.slug && this.title) {
    const base = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let candidate = base || 'article';
    const Article = this.constructor;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await Article.findOne({ slug: candidate, _id: { $ne: this._id } });
      if (!existing) break;
      const suffix = Math.random().toString(36).slice(2, 7);
      candidate = `${base}-${suffix}`;
    }

    this.slug = candidate;
  }
  next();
});

articleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.isModified('content') && this.content) {
    const wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

module.exports = mongoose.model('Article', articleSchema);
