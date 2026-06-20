# MongoDB Database Design — AI Image World

| | |
|---|---|
| **Document** | Database Architecture & Schema Design |
| **Version** | 1.0 |
| **Date** | 19 June 2026 |
| **Prepared by** | Senior MongoDB Architect |
| **Database** | MongoDB 6.x+ (Replica Set / Atlas) |
| **ODM** | Mongoose 8.x |

---

## 1. Database ER Diagram

MongoDB is document-oriented, so "relationships" are expressed as **referenced** (`ObjectId`) or **embedded** documents. The diagram below shows logical relationships across the five collections.

```
┌───────────────────────────┐
│        adminusers         │
│───────────────────────────│
│ _id (PK)                  │
│ name                      │
│ email (unique)            │
│ passwordHash              │
│ role                      │
│ status                    │
│ lastLoginAt               │
│ createdAt / updatedAt     │
└─────────────┬─────────────┘
              │ 1
              │  creates / updates
              │ N
              ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│          images           │  N   1  │        categories         │
│───────────────────────────│────────►│───────────────────────────│
│ _id (PK)                  │ category│ _id (PK)                  │
│ title                     │  (ref)  │ name (unique)             │
│ slug (unique)             │         │ slug (unique)             │
│ imageUrl                  │         │ description               │
│ thumbnailUrl              │         │ thumbnailUrl              │
│ prompt                    │         │ imageCount (denormalized) │
│ negativePrompt            │         │ views                     │
│ category (FK ref)         │         │ isActive                  │
│ tags []                   │         │ seoTitle / seoDescription │
│ views                     │         │ createdAt / updatedAt     │
│ promptCopyCount           │         └─────────────┬─────────────┘
│ featured                  │                       │ 1
│ status                    │                       │  referenced by
│ seoTitle / seoDescription │                       │ N (analytics targetType=category)
│ sourceAiTool              │                       │
│ createdBy (ref adminusers)│                       │
│ publishedAt / scheduledAt │                       │
│ createdAt / updatedAt     │                       │
└─────────────┬─────────────┘                       │
              │ 1                                    │
              │  is target of                        │
              │ N (targetType=image)                 │
              ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                            analytics                              │
│───────────────────────────────────────────────────────────────────│
│ _id (PK)                                                          │
│ eventType (visit | image_view | category_view | prompt_copy)      │
│ targetType (image | category | site)                              │
│ targetId (ref images / categories — polymorphic)                  │
│ sessionId (anonymized)                                            │
│ visitorHash (anonymized daily fingerprint)                        │
│ referrer / device / country                                       │
│ day (YYYY-MM-DD) / month (YYYY-MM)                                 │
│ createdAt                                                          │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐
│        searchlogs         │
│───────────────────────────│
│ _id (PK)                  │
│ query (normalized)        │
│ rawQuery                  │
│ resultsCount              │
│ clickedImageId (ref)      │
│ sessionId                 │
│ day / month               │
│ createdAt                 │
└───────────────────────────┘
```

**Relationship legend**

| From | To | Cardinality | Type |
|---|---|---|---|
| adminusers → images | 1 → N | One admin creates many images | Reference (`createdBy`) |
| categories → images | 1 → N | One category holds many images | Reference (`category`) |
| images → analytics | 1 → N | One image has many analytic events | Polymorphic reference (`targetId`) |
| categories → analytics | 1 → N | One category has many analytic events | Polymorphic reference (`targetId`) |
| images → searchlogs | 1 → N | One image can be the click-through of many searches | Reference (`clickedImageId`) |

---

## 2. Collection Relationships & Design Rationale

### 2.1 Reference vs. Embed decisions
| Relationship | Decision | Reason |
|---|---|---|
| Image → Category | **Reference** | Categories are a bounded, frequently-updated set browsed independently. Referencing avoids duplicating category data across thousands of images and keeps renames atomic. |
| Image → Tags | **Embed (array of strings)** | Tags are small, image-specific, and queried with the image. No separate Tags collection needed for v1.0. |
| Image → createdBy (Admin) | **Reference** | Audit/ownership link; admin data lives independently. |
| Analytics → target | **Polymorphic reference** (`targetType` + `targetId`) | One flexible event collection serves images, categories, and site-wide visits — simpler than per-target collections. |
| Category → imageCount/views | **Denormalized counters** | Avoids expensive `count`/aggregation on every category page load. Updated via `$inc`. |

### 2.2 Denormalization strategy
- **`images.views` / `images.promptCopyCount`** — incremented in place with `$inc` for instant reads on listing/detail pages. The raw `analytics` events remain the source of truth for time-series reporting.
- **`categories.imageCount` / `categories.views`** — maintained on image create/delete and category-view events so category grids render without aggregation.

> **Principle:** Hot counters live denormalized on the parent document for fast reads; the immutable event log in `analytics` enables accurate historical reporting and reconciliation.

---

## 3. Mongoose Schemas

> All schemas use `timestamps: true` (auto `createdAt`/`updatedAt`) and explicit indexes. Field-level comments note intent.

### 3.1 AdminUser

```javascript
// models/AdminUser.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    // Store ONLY the bcrypt/argon2 hash — never plaintext.
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'editor'],
      default: 'admin',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }, // for throttling/lockout
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
```

### 3.2 Category

```javascript
// models/Category.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },
    thumbnailUrl: { type: String },

    // Denormalized counters for fast category-grid rendering.
    imageCount: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },

    // SEO
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
```

### 3.3 Image (core collection)

```javascript
// models/Image.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const STATUS = ['draft', 'published', 'scheduled'];

const imageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    imageUrl: { type: String, required: true },     // full-resolution / CDN URL
    thumbnailUrl: { type: String },                  // optimized thumbnail

    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: '' },

    // Referenced category (FK). Denormalized name optional for read speed.
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String }, // optional denormalized copy for list rendering

    tags: { type: [String], default: [], index: true },

    // Engagement counters (denormalized hot paths).
    views: { type: Number, default: 0, min: 0 },
    promptCopyCount: { type: Number, default: 0, min: 0 },

    featured: { type: Boolean, default: false, index: true },

    status: { type: String, enum: STATUS, default: 'draft', index: true },

    // SEO
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },

    sourceAiTool: {
      type: String,
      // Free-form but normalized; e.g. Midjourney, DALL·E 3, Stable Diffusion, Flux
      trim: true,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },

    // Lifecycle timestamps distinct from createdAt/updatedAt.
    publishedAt: { type: Date },
    scheduledAt: { type: Date }, // when status === 'scheduled'
  },
  { timestamps: true }
);

// Full-text search across title, prompt, and tags.
imageSchema.index(
  { title: 'text', prompt: 'text', tags: 'text', seoDescription: 'text' },
  { weights: { title: 10, tags: 5, prompt: 3, seoDescription: 1 }, name: 'image_text_idx' }
);

module.exports = mongoose.model('Image', imageSchema);
```

### 3.4 Analytics (event log)

```javascript
// models/Analytics.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const analyticsSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: ['visit', 'image_view', 'category_view', 'prompt_copy'],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['site', 'image', 'category'],
      required: true,
    },
    // Polymorphic reference — null for site-wide visits.
    targetId: { type: Schema.Types.ObjectId, refPath: 'targetModel' },
    targetModel: { type: String, enum: ['Image', 'Category'] },

    // Anonymized identifiers (privacy-compliant — no PII).
    sessionId: { type: String, index: true },
    visitorHash: { type: String }, // daily-rotating hash for unique-visitor counts

    referrer: { type: String },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'other'] },
    country: { type: String }, // ISO country code (optional, GeoIP)

    // Pre-bucketed time keys for cheap grouping.
    day: { type: String, index: true },   // 'YYYY-MM-DD'
    month: { type: String, index: true },  // 'YYYY-MM'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Analytics', analyticsSchema);
```

### 3.5 SearchLog

```javascript
// models/SearchLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const searchLogSchema = new Schema(
  {
    query: { type: String, required: true, lowercase: true, trim: true, index: true }, // normalized
    rawQuery: { type: String },          // exactly what the user typed
    resultsCount: { type: Number, default: 0 },
    clickedImageId: { type: Schema.Types.ObjectId, ref: 'Image' }, // null if no click-through
    sessionId: { type: String },
    device: { type: String },
    day: { type: String, index: true },  // 'YYYY-MM-DD'
    month: { type: String, index: true }, // 'YYYY-MM'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('SearchLog', searchLogSchema);
```

---

## 4. Recommended Indexes

> Index for your **read patterns**. Below, each index is paired with the query it serves.

### 4.1 images
| Index | Type | Serves |
|---|---|---|
| `{ slug: 1 }` (unique) | Single | Image detail page lookup by slug |
| `{ status: 1, publishedAt: -1 }` | Compound | "Latest" feed (published, newest first) |
| `{ status: 1, views: -1, publishedAt: -1 }` | Compound | "Trending" / most-viewed within published |
| `{ category: 1, status: 1, publishedAt: -1 }` | Compound | Category page listings |
| `{ featured: 1, status: 1, publishedAt: -1 }` | Compound | Homepage featured carousel |
| `{ status: 1, scheduledAt: 1 }` | Compound | Scheduler job: publish due "scheduled" images |
| `{ tags: 1 }` | Multikey | Tag filtering |
| text index (`image_text_idx`) | Text | Keyword search across title/prompt/tags |

```javascript
imageSchema.index({ slug: 1 }, { unique: true });
imageSchema.index({ status: 1, publishedAt: -1 });
imageSchema.index({ status: 1, views: -1, publishedAt: -1 });
imageSchema.index({ category: 1, status: 1, publishedAt: -1 });
imageSchema.index({ featured: 1, status: 1, publishedAt: -1 });
imageSchema.index({ status: 1, scheduledAt: 1 });
```

### 4.2 categories
| Index | Serves |
|---|---|
| `{ slug: 1 }` (unique) | Category page lookup |
| `{ name: 1 }` (unique) | Duplicate prevention |
| `{ isActive: 1, sortOrder: 1 }` | Ordered category menu/grid |

### 4.3 adminusers
| Index | Serves |
|---|---|
| `{ email: 1 }` (unique) | Login lookup |
| `{ role: 1, status: 1 }` | Admin management filtering |

### 4.4 analytics
| Index | Serves |
|---|---|
| `{ day: 1, eventType: 1 }` | Daily visitor/event rollups |
| `{ month: 1, eventType: 1 }` | Monthly rollups |
| `{ targetType: 1, targetId: 1, eventType: 1 }` | Most-viewed images/categories |
| `{ createdAt: 1 }` **TTL (optional)** | Auto-expire raw events after N days (keep aggregates) |

```javascript
analyticsSchema.index({ day: 1, eventType: 1 });
analyticsSchema.index({ month: 1, eventType: 1 });
analyticsSchema.index({ targetType: 1, targetId: 1, eventType: 1 });
// Optional: expire raw events after 180 days (rollups preserved elsewhere)
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });
```

### 4.5 searchlogs
| Index | Serves |
|---|---|
| `{ query: 1, day: 1 }` | Top searches per day |
| `{ day: 1 }` | Search volume trends |
| `{ createdAt: 1 }` TTL (optional) | Retention control |

> **Avoid over-indexing.** Each index costs write throughput and RAM. Validate with `explain('executionStats')` and drop unused indexes (`$indexStats`).

---

## 5. Scalability Best Practices

### 5.1 Counters & write contention
- Use **`$inc`** for `views` / `promptCopyCount` — atomic and lock-free.
- For very high traffic, **batch counter updates** (buffer in Redis/queue, flush periodically) to avoid hot-document contention on a single popular image.
- Keep the immutable `analytics` event log as the source of truth; reconcile denormalized counters periodically.

### 5.2 Analytics at scale (time-series)
- Consider a **MongoDB Time Series collection** for `analytics` (native bucketing, compression, faster range scans).
- **Pre-aggregate** into daily/monthly rollup collections (`analytics_daily`) via a scheduled job; dashboards read rollups, not raw events.
- Apply a **TTL index** to purge raw events after a retention window once they've been rolled up.

### 5.3 Sharding strategy (when single replica set is outgrown)
| Collection | Suggested shard key | Reason |
|---|---|---|
| `analytics` | `{ day: 1, _id: 1 }` (or hashed `sessionId`) | High-volume writes spread across time/sessions |
| `searchlogs` | hashed `sessionId` or `{ day: 1 }` | Even write distribution |
| `images` | hashed `_id` | Reads by `_id`/`slug` are point lookups; even distribution |

> Avoid monotonically increasing shard keys alone (e.g., raw `createdAt`) — they create a write hotspot. Compound or hashed keys distribute load.

### 5.4 Read performance
- Serve images/thumbnails from a **CDN + object storage** (S3/Cloudinary); store only URLs in Mongo.
- Use **projections** to fetch only needed fields on list pages (exclude long `prompt`/`negativePrompt` from grids).
- Add a **caching layer** (Redis) for homepage, trending, and category pages with short TTLs.
- Use **cursor/keyset pagination** (`publishedAt` + `_id`) instead of `skip()` for deep pagination.

### 5.5 Data integrity & operations
- Run on a **replica set** (HA + read scaling via secondary reads where staleness is acceptable).
- Enforce schema rules with Mongoose validators **and** consider MongoDB **schema validation** at the collection level as a safety net.
- Use **transactions** only where multi-document atomicity is required (e.g., delete image + decrement `category.imageCount`).
- **Backups:** enable continuous/PITR backups (Atlas) or scheduled `mongodump`.
- Maintain a **scheduled job** to flip `scheduled` → `published` when `scheduledAt <= now` (served by the `{ status, scheduledAt }` index).

### 5.6 Security
- Store password hashes with **bcrypt/argon2**; mark `passwordHash` as `select: false`.
- Enforce **least-privilege DB users**, network allowlists, and TLS connections.
- Never log PII; analytics identifiers are **anonymized hashes** only (GDPR-friendly).

---

## 6. Operational Checklist

- [ ] Indexes created and validated with `explain()` against real query patterns.
- [ ] TTL retention configured for `analytics` / `searchlogs`.
- [ ] Denormalized counter reconciliation job scheduled.
- [ ] Scheduled-publish cron job in place.
- [ ] Daily/monthly rollup aggregation job in place.
- [ ] Replica set + automated backups enabled.
- [ ] Collection-level schema validation enabled as a safety net.
- [ ] CDN configured for image delivery; Mongo stores URLs only.

---

*End of Document — AI Image World MongoDB Design v1.0*
