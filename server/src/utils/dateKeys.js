'use strict';

/**
 * utils/dateKeys.js — UTC day/month bucket keys for analytics & search logs.
 *
 *   dayKey()   → 'YYYY-MM-DD'
 *   monthKey() → 'YYYY-MM'
 */

const pad = (n) => String(n).padStart(2, '0');

function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function monthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

module.exports = { dayKey, monthKey };
