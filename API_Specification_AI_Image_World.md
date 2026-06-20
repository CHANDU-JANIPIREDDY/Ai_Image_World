# REST API Specification — AI Image World

| | |
|---|---|
| **Document** | REST API Specification |
| **Version** | 1.0 |
| **Date** | 19 June 2026 |
| **Prepared by** | Senior Backend Architect |
| **Base URL** | `https://api.aiimageworld.com/api/v1` |
| **Format** | JSON over HTTPS |
| **Auth** | JWT (Bearer access token + httpOnly refresh cookie) |

---

## 1. Conventions

### 1.1 Standard response envelope
**Success**
```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 240, "totalPages": 12 }
}
```
`meta` is present only on paginated list responses.

**Error**
```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
`errors[]` is present only for validation failures (422).

### 1.2 HTTP status codes
| Code | Meaning | Used when |
|---|---|---|
| 200 | OK | Successful GET / PUT / action |
| 201 | Created | Resource created (POST) |
| 204 | No Content | Successful DELETE with no body |
| 400 | Bad Request | Malformed request / bad params |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Authenticated but insufficient role |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate (slug/email/category name) |
| 422 | Unprocessable Entity | Validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server fault |

### 1.3 Error codes (machine-readable)
`VALIDATION_ERROR, UNAUTHORIZED, TOKEN_EXPIRED, FORBIDDEN, NOT_FOUND, DUPLICATE_RESOURCE, RATE_LIMITED, UPLOAD_FAILED, ACCOUNT_LOCKED, INTERNAL_ERROR`

### 1.4 Authentication model
- **Access token** — JWT, sent as `Authorization: Bearer <token>`, short-lived (15 min).
- **Refresh token** — httpOnly, Secure, SameSite cookie; rotated on `/auth/refresh`.
- **Roles** — `superadmin`, `admin`, `editor`. Public endpoints require no auth.

### 1.5 Auth requirement legend
| Tag | Meaning |
|---|---|
| 🟢 Public | No authentication |
| 🔒 Admin | Valid access token, role ∈ {superadmin, admin, editor} |
| 🔑 SuperAdmin | Valid access token, role = superadmin |

### 1.6 Common headers
| Header | Direction | Notes |
|---|---|---|
| `Authorization: Bearer <token>` | Request | Required on protected routes |
| `Content-Type: application/json` | Request | Except `/upload/*` → `multipart/form-data` |
| `X-RateLimit-Remaining` | Response | Remaining requests in window |

### 1.7 Pagination & sorting (list endpoints)
| Query param | Type | Default | Notes |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Offset paging |
| `limit` | int 1–50 | 20 | Page size |
| `sort` | enum | `latest` | `latest`, `oldest`, `popular`, `most_copied` |

---

# 2. Authentication APIs

## 2.1 Admin Login
| | |
|---|---|
| **Endpoint** | `/auth/login` |
| **Method** | `POST` |
| **Auth** | 🟢 Public |

**Request Body**
```json
{ "email": "admin@aiimageworld.com", "password": "StrongP@ss123" }
```

**Validation Rules**
| Field | Rule |
|---|---|
| `email` | Required, valid email format, lowercased |
| `password` | Required, string, 8–72 chars |

**Success Response — 200**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": "665f...", "name": "Site Admin", "email": "admin@aiimageworld.com", "role": "admin" }
  }
}
```
> Sets `refreshToken` as httpOnly cookie.

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401 | `UNAUTHORIZED` | Email not found or password mismatch (generic message) |
| 422 | `VALIDATION_ERROR` | Missing/invalid fields |
| 423/403 | `ACCOUNT_LOCKED` | Too many failed attempts (throttled) |
| 429 | `RATE_LIMITED` | Login attempts exceeded |

---

## 2.2 Get Current Admin
| | |
|---|---|
| **Endpoint** | `/auth/me` |
| **Method** | `GET` |
| **Auth** | 🔒 Admin |

**Request Body** — none.

**Success Response — 200**
```json
{
  "success": true,
  "data": { "id": "665f...", "name": "Site Admin", "email": "admin@aiimageworld.com", "role": "admin", "lastLoginAt": "2026-06-19T08:12:00Z" }
}
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401 | `UNAUTHORIZED` / `TOKEN_EXPIRED` | Missing/expired token |

---

## 2.3 Refresh Token
| | |
|---|---|
| **Endpoint** | `/auth/refresh` |
| **Method** | `POST` |
| **Auth** | 🟢 Public (requires refresh cookie) |

**Request Body** — none (reads httpOnly `refreshToken` cookie).

**Success Response — 200**
```json
{ "success": true, "message": "Token refreshed", "data": { "accessToken": "eyJhbGciOi..." } }
```
> Rotates the refresh cookie.

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing/invalid/expired refresh token |

---

## 2.4 Logout
| | |
|---|---|
| **Endpoint** | `/auth/logout` |
| **Method** | `POST` |
| **Auth** | 🔒 Admin |

**Request Body** — none.

**Success Response — 200**
```json
{ "success": true, "message": "Logged out" }
```
> Clears refresh cookie and invalidates the stored refresh token.

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401 | `UNAUTHORIZED` | Not authenticated |

---

## 2.5 Change Password
| | |
|---|---|
| **Endpoint** | `/auth/change-password` |
| **Method** | `PUT` |
| **Auth** | 🔒 Admin |

**Request Body**
```json
{ "currentPassword": "OldP@ss123", "newPassword": "NewStr0ng@Pass" }
```

**Validation Rules**
| Field | Rule |
|---|---|
| `currentPassword` | Required |
| `newPassword` | Required, 8–72 chars, ≥1 upper, ≥1 number, ≠ currentPassword |

**Success Response — 200**
```json
{ "success": true, "message": "Password updated" }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401 | `UNAUTHORIZED` | currentPassword incorrect |
| 422 | `VALIDATION_ERROR` | Weak/invalid new password |

---

# 3. Category APIs

## 3.1 List Categories
| | |
|---|---|
| **Endpoint** | `/categories` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params** — `active` (bool, default true), `includeCounts` (bool).

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "id": "6601...", "name": "Fantasy", "slug": "fantasy", "thumbnailUrl": "https://...", "imageCount": 312, "views": 18420 }
  ]
}
```

**Error Responses** — 500 `INTERNAL_ERROR`.

---

## 3.2 Get Category (with images)
| | |
|---|---|
| **Endpoint** | `/categories/:slug` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params** — `page`, `limit`, `sort` (see §1.7).

**Success Response — 200**
```json
{
  "success": true,
  "data": {
    "category": { "id": "6601...", "name": "Fantasy", "slug": "fantasy", "description": "...", "seoTitle": "...", "seoDescription": "..." },
    "images": [ { "id": "66aa...", "title": "Cosmic Dreamscape", "slug": "cosmic-dreamscape", "thumbnailUrl": "https://...", "views": 12400 } ]
  },
  "meta": { "page": 1, "limit": 20, "total": 312, "totalPages": 16 }
}
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | Slug does not exist |

---

## 3.3 Create Category
| | |
|---|---|
| **Endpoint** | `/categories` |
| **Method** | `POST` |
| **Auth** | 🔒 Admin |

**Request Body**
```json
{
  "name": "Fantasy",
  "description": "Mythical and surreal AI art",
  "thumbnailUrl": "https://res.cloudinary.com/...",
  "seoTitle": "Fantasy AI Images",
  "seoDescription": "Browse fantasy AI-generated art and prompts",
  "isActive": true,
  "sortOrder": 1
}
```

**Validation Rules**
| Field | Rule |
|---|---|
| `name` | Required, 2–80 chars, unique |
| `slug` | Auto-generated from name; must be unique |
| `description` | Optional, ≤ 500 chars |
| `thumbnailUrl` | Optional, valid URL |
| `seoTitle` | Optional, ≤ 70 chars |
| `seoDescription` | Optional, ≤ 160 chars |
| `sortOrder` | Optional, integer |

**Success Response — 201**
```json
{ "success": true, "message": "Category created", "data": { "id": "6601...", "name": "Fantasy", "slug": "fantasy" } }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 409 | `DUPLICATE_RESOURCE` | Name/slug already exists |
| 422 | `VALIDATION_ERROR` | Invalid fields |
| 401/403 | `UNAUTHORIZED` / `FORBIDDEN` | Not authed / wrong role |

---

## 3.4 Update Category
| | |
|---|---|
| **Endpoint** | `/categories/:id` |
| **Method** | `PUT` |
| **Auth** | 🔒 Admin |

**Request Body** — any updatable subset of create fields.
```json
{ "name": "Fantasy Art", "isActive": false }
```

**Validation Rules** — same as create; `name`/`slug` uniqueness re-checked (excluding self).

**Success Response — 200**
```json
{ "success": true, "message": "Category updated", "data": { "id": "6601...", "name": "Fantasy Art", "slug": "fantasy-art" } }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | ID not found |
| 409 | `DUPLICATE_RESOURCE` | Name/slug collision |
| 422 | `VALIDATION_ERROR` | Invalid fields |

---

## 3.5 Delete Category
| | |
|---|---|
| **Endpoint** | `/categories/:id` |
| **Method** | `DELETE` |
| **Auth** | 🔒 Admin |

**Query Params** — `force` (bool). If category has images, delete is rejected unless `force=true` (which requires reassignment strategy).

**Success Response — 200**
```json
{ "success": true, "message": "Category deleted" }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | ID not found |
| 409 | `DUPLICATE_RESOURCE` / `CATEGORY_NOT_EMPTY` | Category still contains images and `force` not set |

---

# 4. Image APIs

## 4.1 List Images
| | |
|---|---|
| **Endpoint** | `/images` |
| **Method** | `GET` |
| **Auth** | 🟢 Public (only `published`) / 🔒 Admin (all statuses) |

**Query Params**
| Param | Type | Notes |
|---|---|---|
| `category` | string (slug/id) | Filter by category |
| `tag` | string | Filter by tag |
| `featured` | bool | Featured only |
| `status` | enum | Admin only: `draft`/`published`/`scheduled` |
| `sort` | enum | `latest`/`popular`/`most_copied` |
| `page`, `limit` | int | Pagination |

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "id": "66aa...", "title": "Cosmic Dreamscape", "slug": "cosmic-dreamscape", "thumbnailUrl": "https://...", "category": { "name": "Fantasy", "slug": "fantasy" }, "views": 12400, "promptCopyCount": 3100, "featured": true }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1284, "totalPages": 65 }
}
```
> List responses exclude full `prompt`/`negativePrompt` (projection) for payload efficiency.

**Error Responses** — 422 `VALIDATION_ERROR` (bad query), 403 if non-admin requests non-published `status`.

---

## 4.2 Get Trending Images
| | |
|---|---|
| **Endpoint** | `/images/trending` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params** — `window` (days, default 7), `limit` (default 20).

**Success Response — 200** — same image array shape as §4.1, ranked by recent view velocity.

**Error Responses** — 500 `INTERNAL_ERROR`.

---

## 4.3 Get Latest Images
| | |
|---|---|
| **Endpoint** | `/images/latest` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params** — `page`, `limit`.

**Success Response — 200** — image array sorted by `publishedAt` desc.

---

## 4.4 Get Image Detail
| | |
|---|---|
| **Endpoint** | `/images/:slug` |
| **Method** | `GET` |
| **Auth** | 🟢 Public (published) / 🔒 Admin (any) |

**Behavior** — increments `views` (deduped per session).

**Success Response — 200**
```json
{
  "success": true,
  "data": {
    "id": "66aa...",
    "title": "Cosmic Dreamscape",
    "slug": "cosmic-dreamscape",
    "imageUrl": "https://res.cloudinary.com/.../full.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
    "prompt": "a surreal cosmic dreamscape, neon nebula, ultra detailed",
    "negativePrompt": "blurry, low quality, watermark",
    "category": { "id": "6601...", "name": "Fantasy", "slug": "fantasy" },
    "tags": ["neon", "cosmic", "surreal"],
    "views": 12401,
    "promptCopyCount": 3100,
    "sourceAiTool": "Midjourney",
    "seoTitle": "Cosmic Dreamscape — AI Art",
    "seoDescription": "...",
    "status": "published",
    "publishedAt": "2026-06-01T10:00:00Z",
    "related": [ { "id": "66bb...", "slug": "neon-city", "thumbnailUrl": "https://..." } ]
  }
}
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | Slug not found, or non-published requested by public |

---

## 4.5 Increment Prompt Copy Count
| | |
|---|---|
| **Endpoint** | `/images/:id/copy` |
| **Method** | `POST` |
| **Auth** | 🟢 Public |

**Request Body** — none.

**Success Response — 200**
```json
{ "success": true, "message": "Copy recorded", "data": { "promptCopyCount": 3101 } }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | Image ID not found |
| 429 | `RATE_LIMITED` | Abuse throttling |

---

## 4.6 Create Image
| | |
|---|---|
| **Endpoint** | `/images` |
| **Method** | `POST` |
| **Auth** | 🔒 Admin |

**Request Body**
```json
{
  "title": "Cosmic Dreamscape",
  "imageUrl": "https://res.cloudinary.com/.../full.jpg",
  "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
  "prompt": "a surreal cosmic dreamscape, neon nebula, ultra detailed",
  "negativePrompt": "blurry, low quality",
  "category": "6601...",
  "tags": ["neon", "cosmic"],
  "sourceAiTool": "Midjourney",
  "featured": false,
  "status": "published",
  "scheduledAt": null,
  "seoTitle": "Cosmic Dreamscape — AI Art",
  "seoDescription": "Surreal cosmic AI artwork with prompt"
}
```

**Validation Rules**
| Field | Rule |
|---|---|
| `title` | Required, 2–150 chars |
| `slug` | Auto from title; unique |
| `imageUrl` | Required, valid URL (Cloudinary) |
| `prompt` | Required, non-empty |
| `negativePrompt` | Optional string |
| `category` | Required, must reference existing category |
| `tags` | Optional array of strings (≤ 20, each ≤ 30 chars) |
| `status` | Enum `draft`/`published`/`scheduled` |
| `scheduledAt` | Required & future date **iff** `status="scheduled"` |
| `sourceAiTool` | Optional string |
| `seoTitle` | Optional, ≤ 70 chars |
| `seoDescription` | Optional, ≤ 160 chars |

**Success Response — 201**
```json
{ "success": true, "message": "Image created", "data": { "id": "66aa...", "slug": "cosmic-dreamscape", "status": "published" } }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 409 | `DUPLICATE_RESOURCE` | Slug exists |
| 422 | `VALIDATION_ERROR` | Invalid fields / scheduledAt missing for scheduled |
| 404 | `NOT_FOUND` | Referenced category missing |

---

## 4.7 Update Image
| | |
|---|---|
| **Endpoint** | `/images/:id` |
| **Method** | `PUT` |
| **Auth** | 🔒 Admin |

**Request Body** — any updatable subset of create fields.

**Validation Rules** — same as create; slug uniqueness re-checked excluding self; status/scheduledAt consistency enforced.

**Success Response — 200**
```json
{ "success": true, "message": "Image updated", "data": { "id": "66aa...", "slug": "cosmic-dreamscape" } }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | Image/category not found |
| 409 | `DUPLICATE_RESOURCE` | Slug collision |
| 422 | `VALIDATION_ERROR` | Invalid fields |

---

## 4.8 Delete Image
| | |
|---|---|
| **Endpoint** | `/images/:id` |
| **Method** | `DELETE` |
| **Auth** | 🔒 Admin |

**Behavior** — deletes DB record and removes asset from Cloudinary; decrements `category.imageCount` (transactional).

**Success Response — 200**
```json
{ "success": true, "message": "Image deleted" }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | Image not found |

---

# 5. Search APIs

## 5.1 Search Images
| | |
|---|---|
| **Endpoint** | `/search` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params**
| Param | Type | Rule |
|---|---|---|
| `q` | string | Required, 1–100 chars (trimmed) |
| `category` | string | Optional filter |
| `sort` | enum | `relevance` (default), `latest`, `popular` |
| `page`, `limit` | int | Pagination |

**Behavior** — runs the text index query, logs the query to `searchlogs`.

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "id": "66aa...", "title": "Cosmic Dreamscape", "slug": "cosmic-dreamscape", "thumbnailUrl": "https://...", "category": { "name": "Fantasy", "slug": "fantasy" }, "score": 8.4 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 37, "totalPages": 2, "query": "cosmic neon" }
}
```

**Empty Result — 200** — `data: []`, `meta.total: 0` (not an error).

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Missing/too-long `q` |
| 429 | `RATE_LIMITED` | Search abuse |

---

## 5.2 Search Suggestions (autocomplete)
| | |
|---|---|
| **Endpoint** | `/search/suggestions` |
| **Method** | `GET` |
| **Auth** | 🟢 Public |

**Query Params** — `q` (required, ≥ 2 chars).

**Success Response — 200**
```json
{ "success": true, "data": { "tags": ["neon", "neon city"], "categories": ["Fantasy"], "titles": ["Neon City"] } }
```

**Error Responses** — 422 `VALIDATION_ERROR`.

---

## 5.3 Record Search Click-through
| | |
|---|---|
| **Endpoint** | `/search/click` |
| **Method** | `POST` |
| **Auth** | 🟢 Public |

**Request Body**
```json
{ "query": "cosmic neon", "imageId": "66aa...", "sessionId": "anon-abc123" }
```

**Validation Rules** — `query` required; `imageId` must be valid ObjectId.

**Success Response — 200**
```json
{ "success": true, "message": "Click recorded" }
```

**Error Responses** — 404 `NOT_FOUND` (imageId), 422 `VALIDATION_ERROR`.

---

# 6. Analytics APIs

## 6.1 Record Event
| | |
|---|---|
| **Endpoint** | `/analytics/event` |
| **Method** | `POST` |
| **Auth** | 🟢 Public |

**Request Body**
```json
{
  "eventType": "image_view",
  "targetType": "image",
  "targetId": "66aa...",
  "sessionId": "anon-abc123",
  "referrer": "https://google.com",
  "device": "desktop"
}
```

**Validation Rules**
| Field | Rule |
|---|---|
| `eventType` | Required, enum `visit`/`image_view`/`category_view`/`prompt_copy` |
| `targetType` | Required, enum `site`/`image`/`category` |
| `targetId` | Required if targetType ≠ `site`; valid ObjectId |
| `device` | Optional, enum `mobile`/`tablet`/`desktop`/`other` |

**Success Response — 202**
```json
{ "success": true, "message": "Event accepted" }
```
> Accepted (202) — written asynchronously to keep the endpoint fast.

**Error Responses** — 422 `VALIDATION_ERROR`, 429 `RATE_LIMITED`.

---

## 6.2 Analytics Summary
| | |
|---|---|
| **Endpoint** | `/analytics/summary` |
| **Method** | `GET` |
| **Auth** | 🔒 Admin |

**Query Params** — `from` (date), `to` (date), `granularity` (`day`/`month`).

**Success Response — 200**
```json
{
  "success": true,
  "data": {
    "totalVisitors": 248910,
    "todayVisitors": 3204,
    "monthVisitors": 71540,
    "publishedImages": 1284,
    "series": [
      { "date": "2026-06-18", "visitors": 3110 },
      { "date": "2026-06-19", "visitors": 3204 }
    ]
  }
}
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 401/403 | `UNAUTHORIZED`/`FORBIDDEN` | Not authed / wrong role |
| 422 | `VALIDATION_ERROR` | Invalid date range |

---

## 6.3 Most Viewed Images
| | |
|---|---|
| **Endpoint** | `/analytics/top-images` |
| **Method** | `GET` |
| **Auth** | 🔒 Admin |

**Query Params** — `from`, `to`, `limit` (default 10).

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "id": "66aa...", "title": "Cosmic Dreamscape", "slug": "cosmic-dreamscape", "thumbnailUrl": "https://...", "views": 12400, "promptCopyCount": 3100 }
  ]
}
```

**Error Responses** — 401/403, 422.

---

## 6.4 Most Viewed Categories
| | |
|---|---|
| **Endpoint** | `/analytics/top-categories` |
| **Method** | `GET` |
| **Auth** | 🔒 Admin |

**Query Params** — `from`, `to`, `limit`.

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "id": "6601...", "name": "Fantasy", "slug": "fantasy", "views": 18420, "imageCount": 312 }
  ]
}
```

**Error Responses** — 401/403, 422.

---

## 6.5 Top Search Queries
| | |
|---|---|
| **Endpoint** | `/analytics/top-searches` |
| **Method** | `GET` |
| **Auth** | 🔒 Admin |

**Query Params** — `from`, `to`, `limit`.

**Success Response — 200**
```json
{
  "success": true,
  "data": [
    { "query": "cyberpunk city", "count": 842, "avgResults": 36 },
    { "query": "anime portrait", "count": 610, "avgResults": 51 }
  ]
}
```

**Error Responses** — 401/403, 422.

---

# 7. Upload APIs

## 7.1 Upload Image to Cloudinary
| | |
|---|---|
| **Endpoint** | `/upload/image` |
| **Method** | `POST` |
| **Auth** | 🔒 Admin |
| **Content-Type** | `multipart/form-data` |

**Request Body (form-data)**
| Field | Type | Notes |
|---|---|---|
| `file` | File | The image (jpg/png/webp) |
| `folder` | string (optional) | Cloudinary folder, default `ai-image-world` |

**Validation Rules**
| Field | Rule |
|---|---|
| `file` | Required; MIME ∈ {image/jpeg, image/png, image/webp}; ≤ 10 MB |
| dimensions | Optional max (e.g., ≤ 8000px) |

**Success Response — 201**
```json
{
  "success": true,
  "message": "Upload successful",
  "data": {
    "imageUrl": "https://res.cloudinary.com/.../full.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_400/thumb.jpg",
    "publicId": "ai-image-world/abc123",
    "width": 1024,
    "height": 1536,
    "format": "jpg",
    "bytes": 842133
  }
}
```
> Returns URLs to be saved via Create/Update Image. Upload and DB record are decoupled.

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Wrong type / too large / no file |
| 401/403 | `UNAUTHORIZED`/`FORBIDDEN` | Not authed / wrong role |
| 502/500 | `UPLOAD_FAILED` | Cloudinary error |

---

## 7.2 Delete Uploaded Asset
| | |
|---|---|
| **Endpoint** | `/upload/image/:publicId` |
| **Method** | `DELETE` |
| **Auth** | 🔒 Admin |

**Success Response — 200**
```json
{ "success": true, "message": "Asset deleted" }
```

**Error Responses**
| Status | Code | Cause |
|---|---|---|
| 404 | `NOT_FOUND` | publicId not found on Cloudinary |
| 500 | `UPLOAD_FAILED` | Deletion error |

---

# 8. Cross-Cutting Specifications

### 8.1 Rate limiting
| Scope | Limit |
|---|---|
| Global public | 100 req / min / IP |
| `/auth/login` | 5 req / 15 min / IP |
| `/search` | 30 req / min / IP |
| `/analytics/event`, `/images/:id/copy` | 60 req / min / IP |

Exceeding → **429** `RATE_LIMITED` with `Retry-After` header.

### 8.2 Validation
All request bodies/queries validated at the edge (zod/joi). Failures → **422** with `errors[]` listing each offending field.

### 8.3 Security
- HTTPS only; HSTS enabled.
- JWT verified on every protected route; role checked per endpoint.
- Input sanitized against NoSQL injection & XSS.
- CORS restricted to known client origins.
- Passwords never returned; `passwordHash` excluded from all responses.

### 8.4 Versioning
- URI versioned (`/api/v1`). Breaking changes → `/api/v2`; v1 deprecation announced via `Sunset` header.

### 8.5 Idempotency & counters
- View/copy increments deduped per session within a short window to prevent inflation.
- Counter writes use `$inc`; analytics events are the immutable source of truth for reporting.

---

## 9. Endpoint Summary

| # | Method | Endpoint | Auth |
|---|---|---|---|
| 1 | POST | `/auth/login` | 🟢 |
| 2 | GET | `/auth/me` | 🔒 |
| 3 | POST | `/auth/refresh` | 🟢 (cookie) |
| 4 | POST | `/auth/logout` | 🔒 |
| 5 | PUT | `/auth/change-password` | 🔒 |
| 6 | GET | `/categories` | 🟢 |
| 7 | GET | `/categories/:slug` | 🟢 |
| 8 | POST | `/categories` | 🔒 |
| 9 | PUT | `/categories/:id` | 🔒 |
| 10 | DELETE | `/categories/:id` | 🔒 |
| 11 | GET | `/images` | 🟢/🔒 |
| 12 | GET | `/images/trending` | 🟢 |
| 13 | GET | `/images/latest` | 🟢 |
| 14 | GET | `/images/:slug` | 🟢/🔒 |
| 15 | POST | `/images/:id/copy` | 🟢 |
| 16 | POST | `/images` | 🔒 |
| 17 | PUT | `/images/:id` | 🔒 |
| 18 | DELETE | `/images/:id` | 🔒 |
| 19 | GET | `/search` | 🟢 |
| 20 | GET | `/search/suggestions` | 🟢 |
| 21 | POST | `/search/click` | 🟢 |
| 22 | POST | `/analytics/event` | 🟢 |
| 23 | GET | `/analytics/summary` | 🔒 |
| 24 | GET | `/analytics/top-images` | 🔒 |
| 25 | GET | `/analytics/top-categories` | 🔒 |
| 26 | GET | `/analytics/top-searches` | 🔒 |
| 27 | POST | `/upload/image` | 🔒 |
| 28 | DELETE | `/upload/image/:publicId` | 🔒 |

---

*End of Document — AI Image World REST API Specification v1.0*
