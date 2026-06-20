'use strict';

/**
 * middleware/upload.middleware.js — Multipart image upload (memory storage).
 *
 * Buffers a single image in memory (streamed to Cloudinary by the service —
 * never written to disk). Accepts JPG/PNG/WEBP up to 10MB. Multer errors are
 * translated into 422 VALIDATION_ERROR envelopes.
 *
 * Usage: router.post('/image', uploadSingle, controller.uploadImage)
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const FIELD = 'file';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.validation('Unsupported file type. Allowed: JPG, PNG, WEBP.', [
      { field: FIELD, message: 'Must be a JPG, PNG, or WEBP image' },
    ]));
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single(FIELD);

/**
 * Run multer and normalize its errors into ApiError responses.
 */
function uploadSingle(req, res, next) {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.validation('File exceeds the 10MB limit', [
              { field: FIELD, message: 'Max size is 10MB' },
            ])
          );
        }
        return next(ApiError.validation(err.message, [{ field: FIELD, message: err.message }]));
      }
      return next(err); // ApiError from fileFilter, or unknown
    }
    next();
  });
}

module.exports = { uploadSingle };
