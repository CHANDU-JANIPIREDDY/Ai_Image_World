'use strict';

/**
 * services/image.service.js — Image (core content) business logic.
 *
 * CRUD + discovery feeds (trending/latest), detail with view increment and
 * related images, prompt-copy increment, and denormalized category counter
 * maintenance. Public callers see only published content; admins see all.
 */

const slugify = require('slugify');

const ApiError = require('../utils/ApiError');
const { Image, Category } = require('../models');
const cloudinaryService = require('./cloudinary.service');

const toSlug = (title) => slugify(title, { lower: true, strict: true, trim: true });

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Heavy fields excluded from list/grid responses (API Spec §4.1).
const LIST_PROJECTION = '-prompt -negativePrompt -seoDescription';

const SORTS = {
  latest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  popular: { views: -1, publishedAt: -1 },
  most_copied: { promptCopyCount: -1, publishedAt: -1 },
};

/* --------------------------------- Helpers --------------------------------- */

/** Load a category by id or throw 404. Returns the doc. */
async function requireCategory(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found', 'NOT_FOUND');
  return category;
}

/** Ensure no other image uses this slug. */
async function assertUniqueSlug(slug, excludeId) {
  const query = { slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) };
  if (await Image.exists(query)) {
    throw ApiError.conflict('An image with this title/slug already exists', 'DUPLICATE_RESOURCE');
  }
}

/** Resolve a category param (slug OR id) to an ObjectId, or null if unknown. */
async function resolveCategoryId(categoryParam) {
  if (!categoryParam) return undefined;
  if (OBJECT_ID_RE.test(categoryParam)) return categoryParam;
  const cat = await Category.findOne({ slug: categoryParam }).select('_id').lean();
  return cat ? cat._id : null; // null = no such category → caller returns empty
}

/* --------------------------------- Create ---------------------------------- */

/**
 * Create an image. Validates the category, generates a unique slug, denormalizes
 * categoryName, and increments the category's imageCount.
 * @param {object} data
 * @param {string} [createdBy]  AdminUser id
 * @returns {Promise<object>}
 */
async function createImage(data, createdBy) {
  const category = await requireCategory(data.category);

  const slug = toSlug(data.title);
  await assertUniqueSlug(slug);

  const image = await Image.create({
    ...data,
    slug,
    categoryName: category.name,
    createdBy,
  });

  await Category.updateOne({ _id: category._id }, { $inc: { imageCount: 1 } });
  return image;
}

/* ---------------------------------- Lists ---------------------------------- */

/**
 * List images with filters, sorting, and pagination.
 * Non-admins are restricted to published content regardless of `status`.
 */
async function getImages({
  category,
  tag,
  featured,
  status,
  sort = 'latest',
  page = 1,
  limit = 20,
  isAdmin = false,
} = {}) {
  const filter = {};

  // Status: admins may filter across all statuses; public is forced to published.
  if (isAdmin) {
    if (status) filter.status = status;
  } else {
    filter.status = 'published';
  }

  if (category !== undefined) {
    const categoryId = await resolveCategoryId(category);
    if (categoryId === null) {
      return { images: [], total: 0, page, limit }; // unknown category
    }
    filter.category = categoryId;
  }

  if (tag) filter.tags = tag;
  if (featured !== undefined) filter.featured = featured;

  const sortSpec = SORTS[sort] || SORTS.latest;
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find(filter, LIST_PROJECTION)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .lean(),
    Image.countDocuments(filter),
  ]);

  return { images, total, page, limit };
}

/**
 * Trending: recently-published images ranked by views (DB Design §4.1 index).
 * @param {object} opts
 * @param {number} [opts.window=7] days
 * @param {number} [opts.limit=20]
 */
async function getTrendingImages({ window = 7, limit = 20 } = {}) {
  const cutoff = new Date(Date.now() - window * 24 * 60 * 60 * 1000);
  return Image.find(
    { status: 'published', publishedAt: { $gte: cutoff } },
    LIST_PROJECTION
  )
    .populate('category', 'name slug')
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Latest published images (reverse-chronological), paginated.
 */
async function getLatestImages({ page = 1, limit = 20 } = {}) {
  const filter = { status: 'published' };
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find(filter, LIST_PROJECTION)
      .populate('category', 'name slug')
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Image.countDocuments(filter),
  ]);

  return { images, total, page, limit };
}

/* --------------------------------- Detail ---------------------------------- */

/**
 * Get an image by slug (full detail) + related images from the same category.
 * Public callers only see published images and trigger a view increment;
 * admins can view any status without inflating the count.
 * @param {string} slug
 * @param {object} opts
 * @param {boolean} [opts.isAdmin=false]
 */
async function getImageBySlug(slug, { isAdmin = false } = {}) {
  const baseQuery = { slug, ...(isAdmin ? {} : { status: 'published' }) };

  // Public detail load increments views atomically; admin preview does not.
  const image = isAdmin
    ? await Image.findOne(baseQuery).populate('category', 'name slug').lean()
    : await Image.findOneAndUpdate(baseQuery, { $inc: { views: 1 } }, { new: true })
        .populate('category', 'name slug')
        .lean();

  if (!image) throw ApiError.notFound('Image not found', 'NOT_FOUND');

  const related = await Image.find(
    { category: image.category?._id || image.category, status: 'published', _id: { $ne: image._id } },
    'title slug thumbnailUrl'
  )
    .sort({ views: -1, publishedAt: -1 })
    .limit(6)
    .lean();

  return { image, related };
}

/* --------------------------------- Update ---------------------------------- */

/**
 * Update an image. Handles slug regeneration on title change, category change
 * (with counter + denormalized name maintenance), and scheduled consistency.
 */
async function updateImage(id, data) {
  const image = await Image.findById(id);
  if (!image) throw ApiError.notFound('Image not found', 'NOT_FOUND');

  // Title change → regenerate + re-check slug.
  if (data.title && data.title !== image.title) {
    const newSlug = toSlug(data.title);
    await assertUniqueSlug(newSlug, id);
    image.title = data.title;
    image.slug = newSlug;
  }

  // Category change → validate, move counters, denormalize name.
  if (data.category && String(data.category) !== String(image.category)) {
    const newCategory = await requireCategory(data.category);
    const oldCategoryId = image.category;
    image.category = newCategory._id;
    image.categoryName = newCategory.name;
    await Promise.all([
      Category.updateOne({ _id: oldCategoryId }, { $inc: { imageCount: -1 } }),
      Category.updateOne({ _id: newCategory._id }, { $inc: { imageCount: 1 } }),
    ]);
  }

  const updatable = [
    'imageUrl',
    'thumbnailUrl',
    'publicId',
    'prompt',
    'negativePrompt',
    'tags',
    'sourceAiTool',
    'featured',
    'status',
    'scheduledAt',
    'seoTitle',
    'seoDescription',
  ];
  for (const key of updatable) {
    if (data[key] !== undefined) image[key] = data[key];
  }

  // Final-state consistency: scheduled requires a future scheduledAt.
  if (image.status === 'scheduled' && (!image.scheduledAt || image.scheduledAt.getTime() <= Date.now())) {
    throw ApiError.validation('scheduledAt must be a future date when status is "scheduled"', [
      { field: 'scheduledAt', message: 'Required and must be in the future' },
    ]);
  }

  await image.save(); // hooks: publishedAt stamping
  return image;
}

/* --------------------------------- Delete ---------------------------------- */

/**
 * Delete an image: remove its Cloudinary asset (best-effort), delete the
 * record, and decrement the category's imageCount.
 */
async function deleteImage(id) {
  const image = await Image.findById(id);
  if (!image) throw ApiError.notFound('Image not found', 'NOT_FOUND');

  // Best-effort asset cleanup — a storage hiccup must not block the DB delete.
  if (image.publicId) {
    try {
      await cloudinaryService.deleteImage(image.publicId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Cloudinary cleanup failed for ${image.publicId}: ${err.message}`);
    }
  }

  await Image.deleteOne({ _id: id });
  await Category.updateOne({ _id: image.category }, { $inc: { imageCount: -1 } });
  return { id };
}

/* ----------------------------- Prompt copy count ---------------------------- */

/**
 * Increment an image's promptCopyCount (API Spec §4.5).
 * @returns {Promise<{ promptCopyCount: number }>}
 */
async function incrementPromptCopyCount(id) {
  const image = await Image.findByIdAndUpdate(
    id,
    { $inc: { promptCopyCount: 1 } },
    { new: true, projection: 'promptCopyCount' }
  ).lean();
  if (!image) throw ApiError.notFound('Image not found', 'NOT_FOUND');
  return { promptCopyCount: image.promptCopyCount };
}

module.exports = {
  createImage,
  getImages,
  getTrendingImages,
  getLatestImages,
  getImageBySlug,
  updateImage,
  deleteImage,
  incrementPromptCopyCount,
};
