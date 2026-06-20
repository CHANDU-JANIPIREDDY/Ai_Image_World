'use strict';

/**
 * models/Image.js — Core content collection.
 *
 * Each document pairs an AI image with its prompt(s) and metadata. Includes a
 * weighted text index for search and read-pattern indexes for the latest /
 * trending / category / featured / scheduled feeds (DB Design §4.1).
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const STATUS = ['draft', 'published', 'scheduled'];

const imageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    imageUrl: { type: String, required: true }, // full-resolution / CDN URL
    thumbnailUrl: { type: String }, // optimized thumbnail
    publicId: { type: String }, // Cloudinary public_id (for asset deletion)

    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: '' },

    // Referenced category (FK) + optional denormalized name for list rendering.
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String },

    tags: { type: [String], default: [] },

    // Engagement counters (denormalized hot paths, updated via $inc).
    views: { type: Number, default: 0, min: 0 },
    promptCopyCount: { type: Number, default: 0, min: 0 },

    featured: { type: Boolean, default: false },

    status: { type: String, enum: STATUS, default: 'draft' },

    // SEO
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },

    sourceAiTool: { type: String, trim: true }, // e.g. Midjourney, DALL·E 3, Flux

    createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },

    // Lifecycle timestamps, distinct from createdAt/updatedAt.
    publishedAt: { type: Date },
    scheduledAt: { type: Date }, // required when status === 'scheduled'
  },
  { timestamps: true }
);

/* -------------------------------- Indexes -------------------------------- */

// Weighted full-text search across title, prompt, tags, seoDescription.
imageSchema.index(
  { title: 'text', prompt: 'text', tags: 'text', seoDescription: 'text' },
  {
    weights: { title: 10, tags: 5, prompt: 3, seoDescription: 1 },
    name: 'image_text_idx',
  }
);

imageSchema.index({ status: 1, publishedAt: -1 }); // latest feed
imageSchema.index({ status: 1, views: -1, publishedAt: -1 }); // trending / most-viewed
imageSchema.index({ category: 1, status: 1, publishedAt: -1 }); // category listings
imageSchema.index({ featured: 1, status: 1, publishedAt: -1 }); // homepage featured
imageSchema.index({ status: 1, scheduledAt: 1 }); // scheduled-publish job
imageSchema.index({ tags: 1 }); // tag filtering

/* --------------------------------- Hooks --------------------------------- */

// Generate slug from title when the title changes.
imageSchema.pre('validate', function generateSlug(next) {
  if (this.title && (this.isModified('title') || !this.slug)) {
    this.slug = slugify(this.title, { lower: true, strict: true, trim: true });
  }
  next();
});

// Stamp publishedAt the first time an image becomes published.
imageSchema.pre('save', function stampPublishedAt(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Image', imageSchema);
