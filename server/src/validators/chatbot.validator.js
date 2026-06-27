'use strict';

/**
 * validators/chatbot.validator.js — Schema for the chatbot endpoint.
 */

const { z } = require('zod');

// POST /chatbot/message
const messageSchema = {
  body: z.object({
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long').trim(),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'bot', 'model']),
          text: z.string().max(2000),
        })
      )
      .max(20)
      .optional()
      .default([]),
  }),
};

module.exports = { messageSchema };
