'use strict';

/**
 * controllers/upload.controller.js — Upload endpoint handlers (thin).
 *
 * uploadImage : multipart file (memory buffer) → Cloudinary → URLs + metadata.
 * deleteAsset : remove an asset by publicId (folder-nested ids supported).
 * Response shapes follow API Spec §7.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('../services/cloudinary.service');

/** POST /upload/image  (Admin, multipart/form-data) */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw ApiError.validation('No image file provided', [
      { field: 'file', message: 'A file is required' },
    ]);
  }

  const folder = typeof req.body.folder === 'string' ? req.body.folder.trim() : undefined;
  const result = await cloudinaryService.uploadImage(req.file.buffer, {
    folder,
    mimetype: req.file.mimetype,
    req, // lets the local-disk fallback build an absolute URL from this request
  });

  return ApiResponse.send(res, {
    statusCode: 201,
    message: 'Upload successful',
    data: result,
  });
});

/** DELETE /upload/image/:publicId  (Admin) */
const deleteAsset = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await cloudinaryService.deleteImage(publicId);
  return ApiResponse.send(res, { message: 'Asset deleted' });
});

module.exports = { uploadImage, deleteAsset };
