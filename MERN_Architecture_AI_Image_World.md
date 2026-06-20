# MERN Stack Architecture — AI Image World

| | |
|---|---|
| **Document** | Production-Ready MERN Architecture & Folder Structure |
| **Version** | 1.0 |
| **Date** | 19 June 2026 |
| **Prepared by** | Senior MERN Architect |
| **Stack** | MongoDB · Express · React (Vite) · Node.js |
| **Key Libs** | React Router, Tailwind CSS, Axios, React Query (TanStack), JWT, Cloudinary, Mongoose |

---

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                          │
│  React + Vite SPA  •  Tailwind  •  React Router  •  React Query/Axios  │
│  ┌────────────────────────┐        ┌────────────────────────────────┐ │
│  │   Public Website App   │        │     Admin Dashboard App        │ │
│  │ (Home, Categories,     │        │ (Dashboard, Images, Analytics, │ │
│  │  Detail, Search)       │        │  Categories, Settings)         │ │
│  └────────────────────────┘        └────────────────────────────────┘ │
└───────────────────────────────┬────────────────────────────────────────┘
                                 │  HTTPS / REST (JSON) + JWT (Bearer)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API SERVER (Node + Express)                     │
│   Routes ─► Middleware ─► Controllers ─► Services ─► Models (Mongoose) │
│   • Auth (JWT)  • Validation  • Rate limit  • Error handler  • Logger  │
└───────┬───────────────────────────────┬──────────────────────┬─────────┘
        │                               │                      │
        ▼                               ▼                      ▼
┌────────────────┐            ┌──────────────────┐    ┌──────────────────┐
│   MongoDB      │            │    Cloudinary     │    │  Redis (optional) │
│ (Atlas/Replica)│            │ (image storage/   │    │ cache + counter   │
│  5 collections │            │  CDN + transforms)│    │ buffering         │
└────────────────┘            └──────────────────┘    └──────────────────┘
```

**Design principles**
- **Separation of concerns** — Routes (HTTP) → Controllers (req/res) → Services (business logic) → Models (data). Controllers stay thin.
- **Two client surfaces, one API** — Public site and Admin dashboard share the same backend; access split by JWT role.
- **Stateless API** — JWT-based auth, horizontally scalable behind a load balancer.
- **Media offloaded to Cloudinary** — Mongo stores only URLs (per the DB design).

---

## 2. Complete Folder Structure (Monorepo)

```
ai-image-world/
├── client/                     # React + Vite frontend
├── server/                     # Node + Express backend
├── .env.example
├── .gitignore
├── docker-compose.yml          # local: api + mongo + redis
├── package.json                # root scripts (concurrently)
└── README.md
```

### 2.1 Backend — `server/`

```
server/
├── src/
│   ├── config/
│   │   ├── db.js                 # Mongoose connection
│   │   ├── cloudinary.js         # Cloudinary SDK config
│   │   ├── env.js                # validated env vars (zod/envalid)
│   │   └── index.js
│   │
│   ├── models/                   # Mongoose schemas (from DB Design doc)
│   │   ├── AdminUser.js
│   │   ├── Category.js
│   │   ├── Image.js
│   │   ├── Analytics.js
│   │   └── SearchLog.js
│   │
│   ├── routes/                   # Express routers (HTTP layer only)
│   │   ├── index.js              # mounts all routers under /api/v1
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── image.routes.js
│   │   ├── analytics.routes.js
│   │   ├── search.routes.js
│   │   └── upload.routes.js
│   │
│   ├── controllers/              # request/response orchestration
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── image.controller.js
│   │   ├── analytics.controller.js
│   │   ├── search.controller.js
│   │   └── upload.controller.js
│   │
│   ├── services/                 # business logic (reusable, testable)
│   │   ├── auth.service.js
│   │   ├── category.service.js
│   │   ├── image.service.js
│   │   ├── analytics.service.js
│   │   ├── search.service.js
│   │   └── cloudinary.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     # verifyJWT, requireRole
│   │   ├── validate.middleware.js # schema validation (zod/joi)
│   │   ├── upload.middleware.js   # multer memory storage → Cloudinary
│   │   ├── rateLimiter.js
│   │   ├── analytics.middleware.js# passive visit tracking
│   │   ├── notFound.js
│   │   └── errorHandler.js        # centralized error responses
│   │
│   ├── validators/                # request schemas
│   │   ├── auth.validator.js
│   │   ├── category.validator.js
│   │   └── image.validator.js
│   │
│   ├── utils/
│   │   ├── ApiError.js            # typed error class
│   │   ├── ApiResponse.js         # standard response envelope
│   │   ├── asyncHandler.js        # try/catch wrapper
│   │   ├── slugify.js
│   │   ├── pagination.js          # keyset/cursor helpers
│   │   └── logger.js              # winston/pino
│   │
│   ├── jobs/                      # scheduled tasks (node-cron / agenda)
│   │   ├── publishScheduled.job.js# scheduled → published
│   │   ├── rollupAnalytics.job.js # daily/monthly aggregation
│   │   └── reconcileCounters.job.js
│   │
│   ├── app.js                     # express app (middleware + routes)
│   └── server.js                  # bootstrap: connect DB, listen
│
├── tests/                         # jest + supertest
│   ├── integration/
│   └── unit/
├── .env
├── .eslintrc / .prettierrc
└── package.json
```

### 2.2 Frontend — `client/`

```
client/
├── public/
│   └── favicon, robots.txt
├── src/
│   ├── main.jsx                   # app entry; mounts providers
│   ├── App.jsx                    # top-level router
│   ├── index.css                  # Tailwind directives
│   │
│   ├── app/                       # global setup
│   │   ├── router.jsx             # route tree (public + admin)
│   │   ├── queryClient.js         # React Query client config
│   │   └── providers.jsx          # QueryClientProvider, AuthProvider
│   │
│   ├── lib/
│   │   ├── axios.js               # axios instance + interceptors (JWT)
│   │   └── constants.js
│   │
│   ├── api/                       # API call functions (used by hooks)
│   │   ├── auth.api.js
│   │   ├── images.api.js
│   │   ├── categories.api.js
│   │   ├── search.api.js
│   │   └── analytics.api.js
│   │
│   ├── hooks/                     # React Query + custom hooks
│   │   ├── useImages.js
│   │   ├── useImageDetail.js
│   │   ├── useCategories.js
│   │   ├── useSearch.js
│   │   ├── useAnalytics.js
│   │   ├── useAuth.js
│   │   └── useDebounce.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # admin auth state (token, user)
│   │
│   ├── components/                # reusable, presentational
│   │   ├── ui/                    # design-system primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── Toast.jsx
│   │   ├── common/
│   │   │   ├── ImageCard.jsx
│   │   │   ├── ImageGrid.jsx
│   │   │   ├── CategoryCard.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CopyPromptButton.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── layout/                # public site chrome
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── PublicLayout.jsx
│   │   └── admin/                 # admin chrome + widgets
│   │       ├── AdminLayout.jsx
│   │       ├── Sidebar.jsx
│   │       ├── Topbar.jsx
│   │       ├── StatCard.jsx
│   │       ├── DataTable.jsx
│   │       ├── ImageForm.jsx
│   │       ├── CategoryForm.jsx
│   │       └── charts/
│   │           ├── VisitorsChart.jsx
│   │           └── TopListChart.jsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.jsx
│   │   │   ├── CategoriesPage.jsx
│   │   │   ├── CategoryDetailPage.jsx
│   │   │   ├── ImageDetailPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   └── admin/
│   │       ├── LoginPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── AdminCategoriesPage.jsx
│   │       ├── AdminImagesPage.jsx
│   │       ├── AdminImageEditPage.jsx
│   │       ├── AnalyticsPage.jsx
│   │       └── SettingsPage.jsx
│   │
│   ├── routes/
│   │   └── ProtectedRoute.jsx     # guards admin routes by JWT/role
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatNumber.js
│   │   └── clipboard.js
│   │
│   └── assets/
│
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── .env                           # VITE_API_URL, etc.
└── package.json
```

---

## 3. Frontend Architecture

### 3.1 Layered model
```
Pages ──► Hooks (React Query) ──► API modules (Axios) ──► Backend
  │            │
  └──► Components (UI / common / layout / admin)
```
- **Pages** compose components and call hooks; they hold no fetch logic directly.
- **Hooks** wrap React Query (`useQuery`/`useMutation`) — own caching, loading, error, and invalidation.
- **API modules** are thin Axios wrappers (one function per endpoint).
- **Components** are presentational and reusable; data comes via props.

### 3.2 Routing strategy (React Router)
| Surface | Path prefix | Layout | Guard |
|---|---|---|---|
| Public | `/` | `PublicLayout` (Navbar/Footer) | none |
| Admin | `/admin/*` | `AdminLayout` (Sidebar/Topbar) | `ProtectedRoute` |
| Auth | `/admin/login` | bare | redirect if already authed |

```
/                       → HomePage
/categories             → CategoriesPage
/category/:slug         → CategoryDetailPage
/image/:slug            → ImageDetailPage
/search?q=...           → SearchPage
*                       → NotFoundPage

/admin/login            → LoginPage
/admin                  → DashboardPage          (protected)
/admin/categories       → AdminCategoriesPage    (protected)
/admin/images           → AdminImagesPage        (protected)
/admin/images/:id/edit  → AdminImageEditPage      (protected)
/admin/analytics        → AnalyticsPage          (protected)
/admin/settings         → SettingsPage           (protected)
```

### 3.3 Data & state strategy
- **Server state** → React Query (caching, background refetch, pagination, optimistic updates on prompt-copy/view counters).
- **Auth state** → `AuthContext` + token in memory; refresh handled by Axios interceptor.
- **UI state** → local `useState`/`useReducer` (modals, forms).
- **Axios interceptors** → attach `Authorization: Bearer`, handle 401 → redirect to login.
- **Query key conventions** → `['images', {filter}]`, `['image', slug]`, `['categories']`, `['analytics', range]` for predictable invalidation.

---

## 4. Backend Architecture

### 4.1 Request lifecycle
```
HTTP Request
   ▼
Route (auth.routes.js)
   ▼
Middleware chain  → rateLimiter → verifyJWT → requireRole → validate(schema) → upload
   ▼
Controller (thin: parse req, call service, send ApiResponse)
   ▼
Service (business logic, transactions, counter updates)
   ▼
Model (Mongoose) ──► MongoDB
   ▼
errorHandler (catches thrown ApiError → JSON envelope)
```

### 4.2 Standard response envelope
- Success: `{ success: true, data, message, meta? }`
- Error: `{ success: false, message, errors?, code }`
- All async controllers wrapped in `asyncHandler`; all errors funnel to `errorHandler`.

---

## 5. API Route Structure

Base path: **`/api/v1`**

### 5.1 Auth — `/auth`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Admin login → JWT |
| POST | `/auth/logout` | Admin | Invalidate session/refresh |
| GET | `/auth/me` | Admin | Current admin profile |
| POST | `/auth/refresh` | Public+cookie | Rotate access token |

### 5.2 Categories — `/categories`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/categories` | Public | List active categories |
| GET | `/categories/:slug` | Public | Category + its images |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete (guard if non-empty) |

### 5.3 Images — `/images`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/images` | Public | List (filters: status, category, featured, sort, page) |
| GET | `/images/trending` | Public | Trending feed |
| GET | `/images/latest` | Public | Latest feed |
| GET | `/images/:slug` | Public | Detail (+ increment view) |
| POST | `/images/:id/copy` | Public | Increment promptCopyCount |
| POST | `/images` | Admin | Create image |
| PUT | `/images/:id` | Admin | Edit image |
| DELETE | `/images/:id` | Admin | Delete image |

### 5.4 Search — `/search`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/search?q=&category=&page=` | Public | Text search + log query |

### 5.5 Analytics — `/analytics`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/analytics/event` | Public | Record visit/view/copy event |
| GET | `/analytics/summary` | Admin | Total/daily/monthly visitors |
| GET | `/analytics/top-images` | Admin | Most-viewed images |
| GET | `/analytics/top-categories` | Admin | Most-viewed categories |

### 5.6 Upload — `/upload`
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/upload/image` | Admin | Multipart → Cloudinary → returns URLs |

---

## 6. Middleware Structure

| Middleware | Responsibility |
|---|---|
| `rateLimiter` | Throttle by IP (stricter on `/auth/login`) |
| `auth.middleware → verifyJWT` | Validate Bearer token, attach `req.user` |
| `auth.middleware → requireRole(roles)` | Authorize by admin role |
| `validate.middleware` | Validate body/query/params against zod/joi schema |
| `upload.middleware` | Multer memory storage; hands buffer to Cloudinary service |
| `analytics.middleware` | Passively records visit events on public routes |
| `notFound` | 404 for unmatched routes |
| `errorHandler` | Converts thrown `ApiError`/unknown errors → JSON envelope, logs |

**Global app middleware (in `app.js`):** `helmet`, `cors`, `compression`, `express.json`, `cookie-parser`, request logger, then routers, then `notFound`, then `errorHandler`.

---

## 7. Services Layer

Each service owns business logic so controllers stay thin and logic is unit-testable.

| Service | Key responsibilities |
|---|---|
| `auth.service` | Verify credentials, hash compare, issue/rotate JWT, lockout logic |
| `category.service` | CRUD, slug generation, empty-category delete guard, maintain `imageCount` |
| `image.service` | CRUD, slug, status/scheduling logic, `$inc` views & copy count, projections, pagination |
| `analytics.service` | Record events, aggregate summary/top-images/top-categories, unique-visitor logic |
| `search.service` | Text query against index, log search, attach click-through |
| `cloudinary.service` | Upload buffer, generate thumbnail transforms, delete on image removal |

---

## 8. Controllers

Controllers are thin adapters: validate-ready input → call service → return `ApiResponse`. No business logic, no direct Mongoose queries.

| Controller | Maps to routes | Calls |
|---|---|---|
| `auth.controller` | `/auth/*` | `auth.service` |
| `category.controller` | `/categories/*` | `category.service` |
| `image.controller` | `/images/*` | `image.service`, `cloudinary.service` |
| `search.controller` | `/search` | `search.service` |
| `analytics.controller` | `/analytics/*` | `analytics.service` |
| `upload.controller` | `/upload/*` | `cloudinary.service` |

---

## 9. Reusable Components Structure (Frontend)

### 9.1 `ui/` — design-system primitives (stateless)
`Button, Input, Modal, Badge, Spinner, Skeleton, Pagination, Toast` — styled with Tailwind, theme-consistent, used everywhere.

### 9.2 `common/` — shared domain components
| Component | Used by |
|---|---|
| `ImageCard` | Home, Category, Search, Admin lists |
| `ImageGrid` | Home, Category, Search |
| `CategoryCard` | Home, Categories page |
| `SearchBar` | Navbar, Search page |
| `CopyPromptButton` | Image Detail (handles clipboard + copy-count API) |
| `EmptyState` / `ErrorBoundary` | Global fallbacks |

### 9.3 `layout/` (public) & `admin/` (dashboard)
- Public: `Navbar`, `Footer`, `PublicLayout`.
- Admin: `AdminLayout`, `Sidebar`, `Topbar`, `StatCard`, `DataTable`, `ImageForm`, `CategoryForm`, `charts/*`.

---

## 10. Admin Dashboard Pages

| Page | Route | Purpose | Key components |
|---|---|---|---|
| **Login** | `/admin/login` | JWT auth gate | `Input`, `Button` |
| **Dashboard** | `/admin` | KPI overview (visitors, top content) | `StatCard`, `VisitorsChart`, `TopListChart` |
| **Categories** | `/admin/categories` | CRUD categories | `DataTable`, `CategoryForm`, `Modal` |
| **Images** | `/admin/images` | List/filter/CRUD images, upload | `DataTable`, `ImageForm`, `Pagination` |
| **Image Edit** | `/admin/images/:id/edit` | Full image+prompt+SEO edit, status/schedule | `ImageForm`, Cloudinary upload |
| **Analytics** | `/admin/analytics` | Visitors trends, most-viewed images/categories, date filter | charts, `TopListChart` |
| **Settings** | `/admin/settings` | Profile, password change, site config | `Input`, `Button` |

---

## 11. Public Website Pages

| Page | Route | Purpose | Key components |
|---|---|---|---|
| **Home** | `/` | Trending + Latest + featured categories + search entry | `ImageGrid`, `CategoryCard`, `SearchBar` |
| **Categories** | `/categories` | Browse all categories | `CategoryCard` |
| **Category Detail** | `/category/:slug` | Images within a category (sort/paginate) | `ImageGrid`, `Pagination` |
| **Image Detail** | `/image/:slug` | Full image, prompt, negative prompt, copy button, SEO meta, related | `CopyPromptButton`, `ImageGrid` (related) |
| **Search** | `/search?q=` | Keyword search results + filters | `SearchBar`, `ImageGrid`, `EmptyState` |
| **Not Found** | `*` | 404 | `EmptyState` |

---

## 12. Cross-Cutting Concerns

| Concern | Approach |
|---|---|
| **Auth** | JWT access token (short-lived) + refresh token (httpOnly cookie); role-based route guards both client & server |
| **Image storage** | Cloudinary upload via backend; Mongo stores `imageUrl`/`thumbnailUrl` only |
| **Caching** | React Query (client); optional Redis for hot public endpoints (server) |
| **Validation** | zod/joi schemas at the edge (`validate.middleware`) |
| **Security** | helmet, CORS allowlist, rate limiting, input sanitization, HTTPS only |
| **SEO** | Server-provided `seoTitle`/`seoDescription`; React Helmet on detail/category pages |
| **Error handling** | Central `errorHandler` + `ApiError`; `ErrorBoundary` on client |
| **Pagination** | Keyset/cursor on large feeds; offset on admin tables |
| **Env config** | `.env` validated at boot (`config/env.js`); `VITE_*` for client |
| **Deployment** | Client → static host/CDN (Vercel/Netlify); API → Node host (Render/Railway/EC2); DB → Atlas; media → Cloudinary |

---

## 13. Environment Variables (reference)

**Server**
```
PORT, NODE_ENV, MONGO_URI,
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
CLIENT_ORIGIN, REDIS_URL (optional)
```

**Client**
```
VITE_API_URL
```

---

*End of Document — AI Image World MERN Architecture v1.0*
