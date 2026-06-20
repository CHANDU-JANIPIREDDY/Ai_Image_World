'use strict';

/**
 * models/Category.js — Thematic image groupings.
 *
 * Carries denormalized counters (imageCount, views) for fast category-grid
 * rendering without aggregation (DB Design denormalization strategy). The slug
 * is auto-generated from the name before validation.
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    description: { type: String, maxlength: 500 },
    thumbnailUrl: { type: String },

    // Denormalized counters.
    imageCount: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // SEO
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
  },
  { timestamps: true }
);

// Ordered, active-category menu/grid (DB Design §4.2).
categorySchema.index({ isActive: 1, sortOrder: 1 });
// (slug & name uniqueness are enforced by the `unique: true` field options.)

// Generate slug from name whenever name changes.
categorySchema.pre('validate', function generateSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    this.slug = slugify(this.name, { lower: true, strict: true, trim: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
