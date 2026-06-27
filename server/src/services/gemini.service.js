'use strict';

/**
 * services/gemini.service.js — Client for the Google Gemini REST API.
 *
 * Auth: API key sent via the `x-goog-api-key` header — Google's current
 * canonical method (https://ai.google.dev/gemini-api/docs/api-key). The key
 * lives in env (server-side only) and is never exposed to the browser.
 *
 * `generate()` returns the model's raw text; callers that pass a JSON schema
 * parse the returned JSON themselves.
 *
 * Notes on credentials & models (verified empirically against the live API):
 *   - Gemini API keys come in more than one prefix ("AIza…" and "AQ.…"). We do
 *     NOT validate by prefix — the API is the source of truth. A bad key yields
 *     401 UNAUTHENTICATED; a valid one reaches the model.
 *   - Free-tier quota is per-model. `gemini-2.0-flash` currently returns
 *     429 (limit: 0) on free projects, while `gemini-2.5-flash` works. Pick the
 *     model in env (GEMINI_MODEL); this client stays model-agnostic.
 */

const env = require('../config/env');

// API version is overridable. v1beta is current and supports systemInstruction
// + responseSchema (structured JSON output).
const API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const API_BASE = `https://generativelanguage.googleapis.com/${API_VERSION}`;

// Gemini 2.5 models "think" before answering, consuming output tokens — a tight
// budget can return finishReason:MAX_TOKENS with EMPTY text. For a chatbot we
// want fast, direct answers, so thinking is disabled by default (budget 0).
// Set GEMINI_THINKING_BUDGET=-1 to omit it (dynamic thinking) for other models.
const THINKING_BUDGET = Number.parseInt(process.env.GEMINI_THINKING_BUDGET ?? '0', 10);

/** True when a key is present (presence only — the API validates the value). */
const isConfigured = () => Boolean(env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Turn a Gemini JSON error body into a clear, actionable message. */
function describeError(status, bodyText) {
  let reason;
  let message;
  try {
    const err = JSON.parse(bodyText)?.error || {};
    message = err.message;
    reason = err.details?.find((d) => d.reason)?.reason || err.status;
  } catch {
    /* non-JSON body */
  }

  switch (status) {
    case 400:
      return `Gemini 400 (${reason || 'INVALID_ARGUMENT'}): ${message || 'malformed request or API_KEY_INVALID. Verify GEMINI_API_KEY.'}`;
    case 401:
    case 403:
      return `Gemini ${status} (${reason || 'UNAUTHENTICATED'}): the GEMINI_API_KEY is invalid, revoked, or lacks access. Generate a fresh key at https://aistudio.google.com/apikey.`;
    case 404:
      return `Gemini 404 (${reason || 'NOT_FOUND'}): model "${env.GEMINI_MODEL}" was not found for this API version. Check GEMINI_MODEL (e.g. gemini-2.5-flash).`;
    case 429:
      return `Gemini 429 (RESOURCE_EXHAUSTED): no quota for model "${env.GEMINI_MODEL}". This model may have 0 free-tier quota — switch GEMINI_MODEL (gemini-2.5-flash works on free tier) or enable billing.`;
    case 503:
      return `Gemini 503 (${reason || 'UNAVAILABLE'}): the model is temporarily overloaded. Retry shortly.`;
    default:
      return `Gemini ${status}: ${message || bodyText.slice(0, 200)}`;
  }
}

/**
 * Call models/{model}:generateContent.
 *
 * @param {object} opts
 * @param {string}  opts.system        System instruction (role/scope rules).
 * @param {Array}   opts.contents      Gemini `contents` array (chat turns).
 * @param {object} [opts.schema]       Optional responseSchema → forces JSON.
 * @param {number} [opts.temperature]  Sampling temperature.
 * @param {number} [opts.retries]      Retries for transient 503s (default 1).
 * @returns {Promise<string>} The model's text output.
 */
async function generate({ system, contents, schema, temperature = 0.6, retries = 1 }) {
  if (!isConfigured()) throw new Error('GEMINI_API_KEY is not configured');

  const url = `${API_BASE}/models/${env.GEMINI_MODEL}:generateContent`;
  const body = {
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: {
      temperature,
      maxOutputTokens: 1024,
      // Disable "thinking" so the token budget goes to the actual answer.
      ...(Number.isInteger(THINKING_BUDGET) && THINKING_BUDGET >= 0
        ? { thinkingConfig: { thinkingBudget: THINKING_BUDGET } }
        : {}),
      ...(schema
        ? { responseMimeType: 'application/json', responseSchema: schema }
        : {}),
    },
  };

  for (let attempt = 0; ; attempt += 1) {
    // Per-attempt timeout so a slow/hung request never blocks the chat endpoint.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) {
      const json = await res.json();
      const blockReason = json?.promptFeedback?.blockReason;
      if (blockReason) throw new Error(`Gemini blocked the prompt: ${blockReason}`);
      const parts = json?.candidates?.[0]?.content?.parts || [];
      return parts.map((p) => p.text || '').join('').trim();
    }

    // Retry only transient 503s; everything else fails fast with a clear reason.
    const detail = await res.text().catch(() => '');
    if (res.status === 503 && attempt < retries) {
      await sleep(600 * (attempt + 1));
      continue;
    }
    throw new Error(describeError(res.status, detail));
  }
}

module.exports = { generate, isConfigured };
