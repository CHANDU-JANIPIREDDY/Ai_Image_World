'use strict';

/**
 * routes/chatbot.routes.js — AI assistant route (public).
 *
 *   POST /chatbot/message  (rate-limited)  →  read-only, AI-composed reply
 */

const express = require('express');

const chatbotController = require('../controllers/chatbot.controller');
const validate = require('../middleware/validate.middleware');
const { searchLimiter } = require('../middleware/rateLimiter');
const { messageSchema } = require('../validators/chatbot.validator');

const router = express.Router();

router.post('/message', searchLimiter, validate(messageSchema), chatbotController.message);

module.exports = router;
