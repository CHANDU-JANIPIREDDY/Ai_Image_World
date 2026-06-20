'use strict';

/**
 * models/SearchLog.js — Search query log.
 *
 * Captures normalized + raw queries, result counts, and click-through images.
 * Powers the "Top Searches" analytics endpoint and future search tuning.
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const searchLogSchema = new Schema(
  {
    query: { type: String, required: true, lowercase: true, trim: true }, // normalized
    rawQuery: { type: String }, // exactly what the user typed
    resultsCount: { type: Number, default: 0 },
    clickedImageId: { type: Schema.Types.ObjectId, ref: 'Image' }, // null if no click-through
    sessionId: { type: String },
    device: { type: String },

    // Pre-bucketed time keys.
    day: { type: String }, // 'YYYY-MM-DD'
    month: { type: String }, // 'YYYY-MM'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* -------------------------------- Indexes -------------------------------- */

searchLogSchema.index({ query: 1, day: 1 }); // top searches per day
searchLogSchema.index({ day: 1 }); // search-volume trends

// Optional retention: expire raw search logs after 180 days.
searchLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
