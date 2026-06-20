'use strict';

/**
 * models/index.js — Barrel export.
 *
 * Importing from here registers all schemas with Mongoose and gives a single
 * import point: `const { Image, Category } = require('./models');`
 */

const AdminUser = require('./AdminUser');
const Category = require('./Category');
const Image = require('./Image');
const Analytics = require('./Analytics');
const SearchLog = require('./SearchLog');

module.exports = { AdminUser, Category, Image, Analytics, SearchLog };
