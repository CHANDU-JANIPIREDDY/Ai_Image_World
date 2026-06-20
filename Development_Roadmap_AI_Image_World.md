# Development Roadmap — AI Image World

| | |
|---|---|
| **Document** | Development Roadmap & Delivery Plan |
| **Version** | 1.0 |
| **Date** | 19 June 2026 |
| **Prepared by** | Senior Technical Project Manager |
| **Project** | AI Image World (MERN Stack) |
| **Inputs** | SRS · DB Design · MERN Architecture · UI/UX Design · REST API Spec |

---

## 1. Executive Summary

This roadmap sequences AI Image World into **10 phases**, ordered so that each builds on a stable foundation: backend infrastructure first, then auth, then feature modules (Categories → Images → Upload → Analytics), then the two client surfaces (Public Website, Admin Dashboard), and finally Testing and Deployment.

| Metric | Value |
|---|---|
| Total phases | 10 |
| Estimated effort | **~30–34 developer-days** (≈ 6–7 weeks for 1 full-stack dev; ≈ 3–4 weeks for a 2-person team) |
| Critical path | Phase 1 → 2 → 4 → 5 → 8 → 9 → 10 |
| Recommended team | 1 Backend, 1 Frontend (+ shared QA), 1 part-time Designer/PM |

> **Estimation basis:** "days" = focused developer-days (~6 productive hours). Ranges reflect single-dev low end to buffer. Priorities: **P0** = blocker/must, **P1** = high, **P2** = nice-to-have within phase.

---

## 2. Phase Dependency Map

```
P1 Backend Setup ─► P2 Auth ─► P3 Categories ─► P4 Images ─┬─► P5 Upload
                                                            │
                                                            └─► P6 Analytics
                                                                    │
        ┌───────────────────────────────────────────────────────────┘
        ▼
P7 Public Website ──┐
                    ├─► P9 Testing ─► P10 Deployment
P8 Admin Dashboard ─┘
   (P7 & P8 can run in parallel once P4–P6 APIs are stable)
```

---

## 3. Phase Breakdown

---

### Phase 1 — Backend Setup
**Goal:** Establish the project skeleton, database connection, config, and shared infrastructure so feature work can begin.

| # | Task | Priority | Est. |
|---|---|---|---|
| 1.1 | Initialize monorepo (`client/`, `server/`), Git, ESLint/Prettier, `.env.example` | P0 | 0.25d |
| 1.2 | Express app bootstrap (`app.js`/`server.js`), helmet, cors, compression, json parser | P0 | 0.25d |
| 1.3 | MongoDB connection (`config/db.js`) + Atlas/replica set setup | P0 | 0.25d |
| 1.4 | Env validation layer (`config/env.js`) | P1 | 0.25d |
| 1.5 | Define all 5 Mongoose models (AdminUser, Category, Image, Analytics, SearchLog) + indexes | P0 | 0.75d |
| 1.6 | Shared utils: `ApiError`, `ApiResponse`, `asyncHandler`, `slugify`, `pagination`, `logger` | P0 | 0.5d |
| 1.7 | Global middleware: `errorHandler`, `notFound`, base `rateLimiter` | P0 | 0.5d |
| 1.8 | Router skeleton mounted at `/api/v1` + health-check endpoint | P0 | 0.25d |
| 1.9 | Local Docker Compose (api + mongo + redis) | P2 | 0.25d |

**Dependencies:** None (project start).
**Estimated Total:** **2.5–3 days**
**Exit criteria:** Server boots, connects to Mongo, `/health` returns 200, models + indexes created, errors return standard envelope.

---

### Phase 2 — Authentication
**Goal:** Secure admin authentication with JWT access + refresh, role-based authorization.

| # | Task | Priority | Est. |
|---|---|---|---|
| 2.1 | `auth.service`: password hashing (bcrypt/argon2), credential verify | P0 | 0.5d |
| 2.2 | JWT issue/verify (access + refresh), refresh rotation logic | P0 | 0.5d |
| 2.3 | `auth.middleware`: `verifyJWT`, `requireRole(roles)` | P0 | 0.5d |
| 2.4 | Endpoints: `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` | P0 | 0.75d |
| 2.5 | `PUT /auth/change-password` | P1 | 0.25d |
| 2.6 | Login throttling + account lockout (failed attempts) | P1 | 0.5d |
| 2.7 | Seed initial superadmin (script) | P0 | 0.25d |
| 2.8 | Validators for auth payloads (zod/joi) | P0 | 0.25d |

**Dependencies:** Phase 1 (models, middleware, utils).
**Estimated Total:** **3–3.5 days**
**Exit criteria:** Admin can log in, receive tokens, access protected routes; invalid/expired tokens rejected; refresh + logout work; lockout enforced.

---

### Phase 3 — Categories Module
**Goal:** Full CRUD for categories — the dependency for image categorization.

| # | Task | Priority | Est. |
|---|---|---|---|
| 3.1 | `category.service`: create/update/delete/list, slug generation | P0 | 0.5d |
| 3.2 | Duplicate-name guard + non-empty-delete guard (`force` flag) | P0 | 0.5d |
| 3.3 | `imageCount`/`views` counter maintenance hooks | P1 | 0.25d |
| 3.4 | Endpoints: `GET /categories`, `GET /categories/:slug`, `POST/PUT/DELETE` | P0 | 0.75d |
| 3.5 | Category validators | P0 | 0.25d |
| 3.6 | Pagination + sort on category images | P1 | 0.25d |

**Dependencies:** Phase 1 (models), Phase 2 (admin auth for write routes).
**Estimated Total:** **2–2.5 days**
**Exit criteria:** Admin can manage categories; public can list/browse; guards enforced; counters update.

---

### Phase 4 — Images Module
**Goal:** Core content module — image CRUD, listing, trending/latest, detail, counters.

| # | Task | Priority | Est. |
|---|---|---|---|
| 4.1 | `image.service`: create/update/delete, slug, status & scheduling logic | P0 | 1d |
| 4.2 | List with filters (category, tag, featured, status), projections, pagination | P0 | 0.75d |
| 4.3 | `GET /images/trending` (view-velocity window) + `GET /images/latest` | P0 | 0.5d |
| 4.4 | `GET /images/:slug` detail + view increment (session-deduped) + related | P0 | 0.5d |
| 4.5 | `POST /images/:id/copy` (promptCopyCount increment) | P1 | 0.25d |
| 4.6 | Admin endpoints: `POST/PUT/DELETE /images` (role-gated status access) | P0 | 0.75d |
| 4.7 | Image text index + validators (incl. scheduledAt consistency) | P0 | 0.5d |
| 4.8 | `publishScheduled.job` (cron: scheduled → published) | P1 | 0.5d |

**Dependencies:** Phase 1, 2, 3 (category reference required).
**Estimated Total:** **4.5–5 days**
**Exit criteria:** Full image lifecycle works; trending/latest/detail return correct data; counters increment; scheduled images auto-publish.

---

### Phase 5 — Upload Module
**Goal:** Cloudinary integration for image storage and thumbnail generation.

| # | Task | Priority | Est. |
|---|---|---|---|
| 5.1 | `config/cloudinary.js` + `cloudinary.service` (upload/destroy/transform) | P0 | 0.5d |
| 5.2 | `upload.middleware` (multer memory storage, MIME/size validation) | P0 | 0.5d |
| 5.3 | `POST /upload/image` → returns full + thumbnail URLs | P0 | 0.5d |
| 5.4 | `DELETE /upload/image/:publicId` | P1 | 0.25d |
| 5.5 | Wire image delete → Cloudinary asset cleanup (transactional) | P1 | 0.5d |
| 5.6 | Upload error handling (`UPLOAD_FAILED`) + retry guidance | P1 | 0.25d |

**Dependencies:** Phase 1, 2; integrates with Phase 4 (image create/delete).
**Estimated Total:** **2–2.5 days**
**Exit criteria:** Admin uploads return CDN URLs + thumbnails; deletes remove assets; size/type validation enforced.

---

### Phase 6 — Analytics Module
**Goal:** Event tracking + aggregated reporting endpoints for the dashboard.

| # | Task | Priority | Est. |
|---|---|---|---|
| 6.1 | `analytics.service`: event write (async), day/month bucketing | P0 | 0.5d |
| 6.2 | `POST /analytics/event` (202) + `analytics.middleware` passive visit tracking | P0 | 0.5d |
| 6.3 | `GET /analytics/summary` (total/daily/monthly visitors + series) | P0 | 0.75d |
| 6.4 | `GET /analytics/top-images` + `top-categories` aggregations | P0 | 0.5d |
| 6.5 | `GET /analytics/top-searches` (from searchlogs) | P1 | 0.25d |
| 6.6 | Search module: `GET /search`, `/suggestions`, `POST /search/click` + logging | P0 | 0.75d |
| 6.7 | `rollupAnalytics.job` (daily/monthly pre-aggregation) + TTL on raw events | P1 | 0.5d |
| 6.8 | Unique-visitor logic (visitorHash) | P1 | 0.25d |

**Dependencies:** Phase 1, 2, 3, 4 (targets to track).
**Estimated Total:** **3.5–4 days**
**Exit criteria:** Events recorded; dashboard endpoints return accurate summaries/top lists; search works + logs; rollups run.

> **Note:** Search endpoints are grouped here as they share analytics/logging concerns, but depend only on Phase 4's image text index — can be pulled earlier if Public Website search is prioritized.

---

### Phase 7 — Public Website
**Goal:** Build the public discovery experience per UI/UX spec (dark, glass, masonry).

| # | Task | Priority | Est. |
|---|---|---|---|
| 7.1 | Vite + React + Tailwind setup; design tokens (colors/type/spacing) → Tailwind config | P0 | 0.5d |
| 7.2 | App shell: router, React Query client, Axios instance + interceptors, providers | P0 | 0.5d |
| 7.3 | `ui/` primitives (Button, Input, Modal, Badge, Spinner, Skeleton, Pagination, Toast) | P0 | 1d |
| 7.4 | `common/`: ImageCard, ImageGrid (masonry), CategoryCard, SearchBar, CopyPromptButton, EmptyState | P0 | 1d |
| 7.5 | `PublicLayout` (glass Navbar + Footer) | P0 | 0.5d |
| 7.6 | **HomePage** (hero/search, featured categories, trending, latest masonry + infinite scroll) | P0 | 1d |
| 7.7 | **CategoriesPage** + **CategoryDetailPage** | P0 | 0.75d |
| 7.8 | **ImageDetailPage** (glass panel, prompt/negative, copy button + toast, related) | P0 | 1d |
| 7.9 | **SearchPage** (debounced query, results, filters, empty state) | P0 | 0.75d |
| 7.10 | Hooks: useImages, useImageDetail, useCategories, useSearch + analytics event firing | P0 | 0.5d |
| 7.11 | Responsive QA (masonry reflow), SEO meta (React Helmet), a11y pass | P1 | 0.75d |

**Dependencies:** Phase 4 (images), 3 (categories), 6 (search) APIs.
**Estimated Total:** **7.5–8 days**
**Exit criteria:** All public pages functional on mobile/desktop; prompt copy works with confirmation; search + browse flows complete; matches design system.

---

### Phase 8 — Admin Dashboard
**Goal:** Build the SaaS admin dashboard per UI/UX spec.

| # | Task | Priority | Est. |
|---|---|---|---|
| 8.1 | `AdminLayout` (glass sidebar + topbar), `ProtectedRoute`, `AuthContext` | P0 | 0.75d |
| 8.2 | **LoginPage** (JWT flow, error states) | P0 | 0.5d |
| 8.3 | Admin components: StatCard, DataTable, charts (VisitorsChart, TopListChart) | P0 | 1d |
| 8.4 | **DashboardPage** (analytics cards, charts, most-viewed table) | P0 | 1d |
| 8.5 | **AdminImagesPage** (DataTable, filters, status badges, pagination) | P0 | 0.75d |
| 8.6 | **ImageForm** slide-over + Cloudinary upload (drag-drop, all fields, status/schedule) | P0 | 1.25d |
| 8.7 | **AdminCategoriesPage** + CategoryForm (cards, CRUD, delete confirm) | P0 | 0.75d |
| 8.8 | **AnalyticsPage** (date filters, trends, top images/categories/searches) | P1 | 0.75d |
| 8.9 | **SettingsPage** (profile, change password) | P1 | 0.5d |
| 8.10 | Admin hooks (useAnalytics, mutations w/ optimistic updates + invalidation) | P0 | 0.5d |

**Dependencies:** Phase 2 (auth), 3–6 (all admin APIs). Can run **parallel to Phase 7**.
**Estimated Total:** **7.5–8 days**
**Exit criteria:** Admin can log in, manage categories/images, upload, and view analytics; protected routes enforced; matches design system.

---

### Phase 9 — Testing
**Goal:** Validate functionality, integration, and quality across the stack.

| # | Task | Priority | Est. |
|---|---|---|---|
| 9.1 | Backend unit tests (services: auth, image, category, analytics) | P0 | 1d |
| 9.2 | API integration tests (Jest + Supertest, all 28 endpoints, auth + error paths) | P0 | 1.5d |
| 9.3 | Frontend component tests (key components, hooks) | P1 | 0.75d |
| 9.4 | E2E happy paths (browse → detail → copy; admin login → add image) | P1 | 1d |
| 9.5 | Security review (auth bypass, injection, rate limits, CORS, secrets) | P0 | 0.5d |
| 9.6 | Performance check (image lazy-load, query `explain`, payload sizes) | P1 | 0.5d |
| 9.7 | Cross-browser + responsive + a11y (WCAG AA) audit | P1 | 0.5d |
| 9.8 | Bug fixing / hardening buffer | P0 | 1d |

**Dependencies:** Phases 1–8 (features complete).
**Estimated Total:** **5.5–6 days**
**Exit criteria:** Critical paths pass; no P0/P1 bugs open; security checklist clear; performance within NFR targets.

---

### Phase 10 — Deployment
**Goal:** Ship to production with CI/CD, monitoring, and backups.

| # | Task | Priority | Est. |
|---|---|---|---|
| 10.1 | Provision: MongoDB Atlas (prod), Cloudinary (prod), Redis (if used) | P0 | 0.5d |
| 10.2 | Backend deploy (Render/Railway/EC2) + env secrets management | P0 | 0.5d |
| 10.3 | Frontend deploy (Vercel/Netlify) + `VITE_API_URL` wiring | P0 | 0.25d |
| 10.4 | Domain, HTTPS/SSL, CORS allowlist, HSTS | P0 | 0.5d |
| 10.5 | CI/CD pipeline (lint → test → build → deploy) | P1 | 0.75d |
| 10.6 | Monitoring/logging (uptime, error tracking e.g. Sentry) + alerts | P1 | 0.5d |
| 10.7 | Automated DB backups / PITR + restore test | P0 | 0.25d |
| 10.8 | Seed prod data (superadmin, initial categories) + smoke test | P0 | 0.25d |
| 10.9 | Launch checklist sign-off + rollback plan | P0 | 0.25d |

**Dependencies:** Phase 9 (passing tests).
**Estimated Total:** **3.5–4 days**
**Exit criteria:** App live on production domain over HTTPS; CI/CD green; monitoring + backups active; smoke tests pass.

---

## 4. Consolidated Timeline

| Phase | Name | Priority | Est. (days) | Depends on |
|---|---|---|---|---|
| 1 | Backend Setup | P0 | 2.5–3 | — |
| 2 | Authentication | P0 | 3–3.5 | 1 |
| 3 | Categories | P0 | 2–2.5 | 1, 2 |
| 4 | Images | P0 | 4.5–5 | 1, 2, 3 |
| 5 | Upload | P0 | 2–2.5 | 1, 2, 4 |
| 6 | Analytics + Search | P0/P1 | 3.5–4 | 1–4 |
| 7 | Public Website | P0 | 7.5–8 | 3, 4, 6 |
| 8 | Admin Dashboard | P0 | 7.5–8 | 2–6 |
| 9 | Testing | P0 | 5.5–6 | 1–8 |
| 10 | Deployment | P0 | 3.5–4 | 9 |
| | **TOTAL (1 dev, sequential)** | | **~42–48** | |
| | **With P7/P8 parallelized (2 devs)** | | **~30–34** | |

> Frontend (P7) and Admin (P8) overlap heavily with backend module completion. A 2-person split (1 BE building 1→6, 1 FE building 7→8 as APIs land) compresses the calendar to **~6 weeks**.

---

## 5. Milestones & Gates

| Milestone | Phases | Gate criteria |
|---|---|---|
| **M1 — API Foundation** | 1–2 | Server live, auth working, models indexed |
| **M2 — Content Backend** | 3–5 | Categories + Images + Upload APIs complete & tested |
| **M3 — Backend Complete** | 6 | Analytics + Search done; all 28 endpoints live |
| **M4 — Public MVP** | 7 | Public site fully browsable end-to-end |
| **M5 — Admin Complete** | 8 | Admin can manage all content + view analytics |
| **M6 — Release Candidate** | 9 | Tests pass, security clear, no P0/P1 bugs |
| **M7 — Production Launch** | 10 | Live, monitored, backed up |

---

## 6. Critical Path & Parallelization

**Critical path:** `P1 → P2 → P4 → P5 → P8 → P9 → P10` (the longest dependent chain).

**Parallelization opportunities**
- **P3 Categories** can start as soon as P2 models/auth are stable.
- **P6 Analytics/Search** backend can proceed alongside frontend P7 once P4 is done.
- **P7 Public** and **P8 Admin** run concurrently with separate developers once content APIs (P4–P6) stabilize.
- **P9 Testing** should be continuous (write tests per module), not only at the end — the dedicated phase is for E2E + hardening.

---

## 7. Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | Cloudinary integration delays (Phase 5) | Blocks image creation | Med | Build upload behind interface; mock during P4; spike early |
| R2 | Trending/analytics query performance at scale | Slow dashboards/feeds | Med | Pre-aggregate rollups, indexes, `explain()` early |
| R3 | Counter inflation / contention on popular images | Bad metrics | Med | Session dedupe + `$inc`; buffer via Redis if needed |
| R4 | Scope creep on UI polish (glassmorphism/motion) | Timeline slip | High | Lock design tokens in P7.1; treat advanced motion as P2 |
| R5 | Auth/security gaps | Breach risk | Low-Med | Security review in P9.5; rate limits + lockout in P2 |
| R6 | Parallel FE/BE contract drift | Rework | Med | API spec is source of truth; mock server from spec; contract tests |
| R7 | Scheduled-publish cron reliability | Content not going live | Low | Idempotent job + monitoring/alert on Phase 10 |

---

## 8. Definition of Done (per phase)

A phase is **Done** when:
1. All P0 tasks complete and merged to main.
2. Code reviewed, linted, and unit-tested where applicable.
3. Relevant API/endpoints match the API Specification.
4. Phase exit criteria met and demoed.
5. Documentation/README updated for new setup steps.

---

## 9. Post-Launch (Phase 11+ — Future)

Aligned with SRS "Future Enhancements," prioritized for the next cycle:

| Priority | Enhancement |
|---|---|
| P1 | User accounts, favorites & collections |
| P1 | Advanced analytics (prompt-copy rate, retention cohorts) |
| P2 | AI-powered semantic / image-similarity search |
| P2 | User-submitted images + moderation queue |
| P2 | Role-based admin (Editor/Super Admin separation) |
| P3 | Social sharing/embeds, monetization, i18n, native apps |

---

*End of Document — AI Image World Development Roadmap v1.0*
