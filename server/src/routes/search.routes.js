'use strict';

/**
 * routes/search.routes.js — Search routes (API Spec §5). All public.
 *
 *   GET  /search              (rate-limited)  text search
 *   GET  /search/suggestions  (rate-limited)  autocomplete
 *   POST /search/click                        click-through logging
 */

const express = require('express');

const searchController = require('../controllers/search.controller');
const validate = require('../middleware/validate.middleware');
const { searchLimiter, actionLimiter } = require('../middleware/rateLimiter');
const { searchSchema, suggestionsSchema, clickSchema } = require('../validators/search.validator');

const router = express.Router();

// Static segment before none needed; /suggestions declared before nothing risky.
router.get('/suggestions', searchLimiter, validate(suggestionsSchema), searchController.suggestions);
router.get('/', searchLimiter, validate(searchSchema), searchController.search);
router.post('/click', actionLimiter, validate(clickSchema), searchController.recordClick);

module.exports = router;
