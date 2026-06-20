'use strict';

/**
 * middleware/validate.middleware.js — Generic zod request validator.
 *
 * validate(schema) where schema = { body?, query?, params? } of zod schemas.
 * Parses each present section and replaces req.* with the parsed (coerced,
 * trimmed, defaulted) value. zod failures throw ZodError → the errorHandler
 * maps them to 422 VALIDATION_ERROR with field-level details.
 */

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
