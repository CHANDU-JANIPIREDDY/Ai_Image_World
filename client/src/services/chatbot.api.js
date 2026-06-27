import api from './axios';

/**
 * services/chatbot.api.js — AI assistant endpoint.
 *
 * POST /chatbot/message → { reply, prompts, action } composed server-side from
 * read-only site data (optionally via Gemini). The API key stays on the server.
 */

export const sendChatMessage = (payload) => api.post('/chatbot/message', payload);
