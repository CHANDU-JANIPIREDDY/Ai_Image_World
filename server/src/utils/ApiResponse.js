'use strict';

/**
 * utils/ApiResponse.js — Standard success-envelope sender (API Spec §1.1).
 *
 * Usage:
 *   ApiResponse.send(res, { message: 'Login successful', data: {...} });
 *   ApiResponse.send(res, { statusCode: 201, message: 'Created', data });
 *   ApiResponse.send(res, { message: 'Listed', data, meta });
 *
 * `data` and `meta` are omitted from the body when not provided.
 */

class ApiResponse {
  /**
   * @param {import('express').Response} res
   * @param {object} opts
   * @param {number} [opts.statusCode=200]
   * @param {string} [opts.message='Success']
   * @param {*} [opts.data]
   * @param {object} [opts.meta]   Pagination/meta block (list responses)
   */
  static send(res, { statusCode = 200, message = 'Success', data, meta } = {}) {
    const body = { success: true, message };
    if (data !== undefined) body.data = data;
    if (meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }
}

module.exports = ApiResponse;
