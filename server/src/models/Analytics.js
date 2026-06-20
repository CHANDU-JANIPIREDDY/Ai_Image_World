'use strict';

/**
 * models/Analytics.js — Immutable engagement event log.
 *
 * One polymorphic collection (targetType + targetId) records site visits,
 * image views, category views, and prompt copies. Pre-bucketed day/month keys
 * make rollups cheap. Identifiers are anonymized (no PII) per privacy NFRs.
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const analyticsSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: ['visit', 'image_view', 'category_view', 'prompt_copy'],
      required: true,
    },

    targetType: {
      type: String,
      enum: ['site', 'image', 'category'],
      required: true,
    },

    // Polymorphic reference — null for site-wide visits.
    targetId: { type: Schema.Types.ObjectId, refPath: 'targetModel' },
    targetModel: { type: String, enum: ['Image', 'Category'] },

    // Anonymized identifiers (no PII).
    sessionId: { type: String },
    visitorHash: { type: String }, // daily-rotating hash for unique-visitor counts

    referrer: { type: String },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'other'] },
    country: { type: String }, // ISO code (optional, GeoIP)

    // Pre-bucketed time keys for cheap grouping.
    day: { type: String }, // 'YYYY-MM-DD'
    month: { type: String }, // 'YYYY-MM'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* -------------------------------- Indexes -------------------------------- */

analyticsSchema.index({ day: 1, eventType: 1 }); // daily rollups
analyticsSchema.index({ month: 1, eventType: 1 }); // monthly rollups
analyticsSchema.index({ targetType: 1, targetId: 1, eventType: 1 }); // top images/categories
analyticsSchema.index({ sessionId: 1 }); // unique-visitor / dedupe lookups

// Optional retention: auto-expire raw events after 180 days (rollups preserved
// separately). Comment out to keep raw events indefinitely.
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('Analytics', analyticsSchema);
