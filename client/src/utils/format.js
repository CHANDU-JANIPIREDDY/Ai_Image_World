/**
 * format.js — display formatting helpers.
 */

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** Compact count: 1200 → "1.2K". */
export const formatCount = (n) => compact.format(Number(n) || 0);

/** Human date: "Jun 2026". */
export const formatMonthYear = (date) =>
  date ? new Date(date).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '';
