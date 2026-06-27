'use strict';

/**
 * test-gemini.js — Standalone Gemini API diagnostic. Tests ONLY the Gemini
 * REST API (no Express, no Mongo) and prints exactly what Google returns.
 *
 * Usage:
 *   node test-gemini.js                  # uses GEMINI_MODEL from .env
 *   node test-gemini.js gemini-2.5-flash # override the model to test
 *   node test-gemini.js --matrix         # probe a set of common models
 *
 * Prints: HTTP status, full response body, and a classified diagnosis
 * (auth error / quota error / model error / success).
 */

require('dotenv').config();

const API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const BASE = `https://generativelanguage.googleapis.com/${API_VERSION}`;
const API_KEY = process.env.GEMINI_API_KEY || '';

const MATRIX = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-flash-latest',
];

function maskKey(k) {
  if (!k) return '(empty)';
  if (k.length <= 12) return `${k.slice(0, 4)}…`;
  return `${k.slice(0, 6)}…${k.slice(-4)} (len ${k.length})`;
}

/** Classify an HTTP status + parsed body into a one-line diagnosis. */
function diagnose(status, json) {
  const err = json?.error;
  const reason = err?.details?.find((d) => d.reason)?.reason || err?.status;
  if (status === 200) return '✅ SUCCESS — key + model + endpoint all working.';
  if (status === 400 && reason === 'API_KEY_INVALID')
    return '🔑 AUTH ERROR — API key is malformed/invalid (API_KEY_INVALID).';
  if (status === 401 || status === 403)
    return `🔑 AUTH ERROR — key invalid/revoked/no access (${reason || status}). Get a new key at https://aistudio.google.com/apikey.`;
  if (status === 404)
    return `📛 MODEL ERROR — model not found for ${API_VERSION} (${reason || 'NOT_FOUND'}). Try gemini-2.5-flash.`;
  if (status === 429)
    return '📊 QUOTA ERROR — RESOURCE_EXHAUSTED (limit:0 = this model has no free quota; switch model or enable billing).';
  if (status === 503)
    return '⏳ TRANSIENT — model overloaded (UNAVAILABLE). Retry shortly.';
  return `❓ UNEXPECTED — HTTP ${status} (${reason || 'unknown'}).`;
}

async function callModel(model) {
  const url = `${BASE}/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: OK' }] }],
    // thinkingBudget:0 stops 2.5 models from spending the token budget on
    // "thoughts" and returning empty text (finishReason:MAX_TOKENS).
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 50,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, ms: Date.now() - started, text, json };
}

async function runOne(model) {
  console.log('────────────────────────────────────────────────────────');
  console.log(`Model:     ${model}`);
  console.log(`Endpoint:  ${BASE}/models/${model}:generateContent`);
  console.log(`Auth:      x-goog-api-key header`);
  console.log(`API key:   ${maskKey(API_KEY)}`);
  console.log('────────────────────────────────────────────────────────');

  if (!API_KEY) {
    console.log('❌ GEMINI_API_KEY is empty in .env — nothing to test.');
    return;
  }

  try {
    const { status, ms, text, json } = await callModel(model);
    console.log(`HTTP status: ${status}   (${ms} ms)`);
    const out = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
    if (out) console.log(`Model text:  ${JSON.stringify(out)}`);
    console.log('\nFull response body:');
    console.log(text);
    console.log(`\nDiagnosis: ${diagnose(status, json)}`);
  } catch (e) {
    console.log(`❌ Network/transport error: ${e.message}`);
    console.log('   (DNS, proxy, firewall, or no internet — the request never reached Google.)');
  }
}

async function runMatrix() {
  console.log(`\nProbing ${MATRIX.length} models with key ${maskKey(API_KEY)}…\n`);
  for (const model of MATRIX) {
    try {
      const { status, json } = await callModel(model);
      const reason = json?.error?.details?.find((d) => d.reason)?.reason || json?.error?.status || '';
      const tag =
        status === 200 ? '✅ WORKS' : status === 429 ? '📊 no quota' : status === 503 ? '⏳ overloaded' : `❌ ${reason || status}`;
      console.log(`  ${model.padEnd(24)} HTTP ${status}  ${tag}`);
    } catch (e) {
      console.log(`  ${model.padEnd(24)} ERROR  ${e.message}`);
    }
  }
  console.log('\n→ Set GEMINI_MODEL in .env to any model marked ✅ WORKS.');
}

(async () => {
  const arg = process.argv[2];
  if (arg === '--matrix') {
    await runMatrix();
  } else {
    await runOne(arg || process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  }
})();
