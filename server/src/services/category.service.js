'use strict';

/**
 * services/category.service.js — Category business logic.
 *
 * Owns slug generation, duplicate protection, the non-empty delete guard
 * (with reassignment on force), and paginated/sorted image listing for a
 * category. Controllers call into this and stay thin.
 */

const slugify = require('slugify');

const ApiError = require('../utils/ApiError');
const { Category, Image } = require('../models');

const toSlug = (name) => slugify(name, { lower: true, strict: true, trim: true });

// Sort maps for the images returned by getCategoryBySlug.
const IMAGE_SORTS = {
  latest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  popular: { views: -1, publishedAt: -1 },
  most_copied: { promptCopyCount: -1, publishedAt: -1 },
};

// Fields excluded from list/grid responses (keep payloads lean).
const LIST_PROJECTION = '-prompt -negativePrompt -seoDescription';

/**
 * Ensure no other category uses this name or slug.
 * @param {string} name
 * @param {string} slug
 * @param {string} [excludeId]  Category id to exclude (for updates)
 */
async function assertUnique(name, slug, excludeId) {
  const query = {
    $or: [{ name }, { slug }],
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  };
  const clash = await Category.findOne(query).lean();
  if (clash) {
    const field = clash.slug === slug ? 'slug' : 'name';
    throw ApiError.conflict(`A category with this ${field} already exists`, 'DUPLICATE_RESOURCE');
  }
}

/**
 * Create a category.
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createCategory(data) {
  const slug = toSlug(data.name);
  await assertUnique(data.name, slug);
  const category = await Category.create({ ...data, slug });
  return category;
}

/**
 * List categories (public defaults to active only).
 * @param {object} opts
 * @param {boolean} [opts.active=true]
 * @param {boolean} [opts.includeCounts=true]
 * @returns {Promise<object[]>}
 */
async function getCategories({ active = true, includeCounts = true } = {}) {
  const filter = active ? { isActive: true } : {};
  const projection = includeCounts ? '' : '-imageCount -views';
  return Category.find(filter, projection).sort({ sortOrder: 1, name: 1 }).lean();
}

/**
 * Get a category by slug plus its published images (paginated/sorted).
 * @param {string} slug
 * @param {object} opts
 * @param {number} opts.page
 * @param {number} opts.limit
 * @param {string} opts.sort
 * @returns {Promise<{ category: object, images: object[], total: number, page: number, limit: number }>}
 */
async function getCategoryBySlug(slug, { page = 1, limit = 20, sort = 'latest' } = {}) {
  // Atomically increment the category's view counter on each page load.
  const category = await Category.findOneAndUpdate(
    { slug },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();
  if (!category) throw ApiError.notFound('Category not found', 'NOT_FOUND');

  const filter = { category: category._id, status: 'published' };
  const sortSpec = IMAGE_SORTS[sort] || IMAGE_SORTS.latest;
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find(filter, LIST_PROJECTION).sort(sortSpec).skip(skip).limit(limit).lean(),
    Image.countDocuments(filter),
  ]);

  return { category, images, total, page, limit };
}

/**
 * Update a category by id.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found', 'NOT_FOUND');

  // If the name changes, recompute slug and re-check uniqueness (excluding self).
  if (data.name && data.name !== category.name) {
    const newSlug = toSlug(data.name);
    await assertUnique(data.name, newSlug, id);
    category.name = data.name;
    category.slug = newSlug;
  }

  const updatable = ['description', 'thumbnailUrl', 'isActive', 'sortOrder', 'seoTitle', 'seoDescription'];
  for (const key of updatable) {
    if (data[key] !== undefined) category[key] = data[key];
  }

  await category.save();
  return category;
}

/**
 * Get or create the system "Uncategorized" fallback category.
 * @returns {Promise<object>}
 */
async function getOrCreateUncategorized() {
  const slug = 'uncategorized';
  let cat = await Category.findOne({ slug });
  if (!cat) {
    cat = await Category.create({
      name: 'Uncategorized',
      slug,
      description: 'Images without an assigned category.',
      isActive: false,
    });
  }
  return cat;
}

/**
 * Delete a category.
 * Blocks deletion of non-empty categories unless `force` is set, in which case
 * its images are reassigned to "Uncategorized" before deletion.
 * @param {string} id
 * @param {object} opts
 * @param {boolean} [opts.force=false]
 * @returns {Promise<{ reassigned: number }>}
 */
async function deleteCategory(id, { force = false } = {}) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('Category not found', 'NOT_FOUND');

  const imageCount = await Image.countDocuments({ category: id });

  let reassigned = 0;
  if (imageCount > 0) {
    if (!force) {
      throw ApiError.conflict(
        `Category contains ${imageCount} image(s). Reassign them or pass force=true.`,
        'CATEGORY_NOT_EMPTY'
      );
    }
    const fallback = await getOrCreateUncategorized();
    const result = await Image.updateMany(
      { category: id },
      { $set: { category: fallback._id, categoryName: fallback.name } }
    );
    reassigned = result.modifiedCount || 0;
    await Category.updateOne({ _id: fallback._id }, { $inc: { imageCount: reassigned } });
  }

  await Category.deleteOne({ _id: id });
  return { reassigned };
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};
