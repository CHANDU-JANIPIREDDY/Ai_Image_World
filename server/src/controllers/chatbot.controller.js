'use strict';

/**
 * controllers/chatbot.controller.js — Chatbot endpoint (thin).
 *
 * POST /chatbot/message → { reply, prompts, action } based on read-only site
 * data, optionally composed by Gemini.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const chatbotService = require('../services/chatbot.service');

/** POST /chatbot/message  (Public) */
const message = asyncHandler(async (req, res) => {
  const data = await chatbotService.answer(req.body);
  return ApiResponse.send(res, { message: 'Chatbot reply', data });
});

module.exports = { message };
