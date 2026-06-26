'use strict';

/**
 * app.js — Express application assembly.
 *
 * Builds and configures the Express app (middleware pipeline + routes)
 * but does NOT start the HTTP server. Exporting the configured `app`
 * keeps it importable by tests (Supertest) without binding a port.
 *
 * Middleware order matters:
 *   security/parsing → logging → rate limit → routes → 404 → errorHandler
 */

const path = require('path');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const { version } = require('../package.json');
const apiRoutes = require('./routes');
const { globalLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust the first proxy hop (needed for correct client IPs behind a load
// balancer/host, which rate limiting and secure cookies depend on).
app.set('trust proxy', 1);

/* ----------------------------- Security & parsing ----------------------------- */

// Secure HTTP headers (HSTS, etc. tightened further in production).
app.use(helmet());

// CORS — restricted to the known client origin(s). Credentials enabled so the
// httpOnly refresh-token cookie (API Spec §1.4) can be sent cross-origin.
//
// A function (not a static array) is used so we can: tolerate trailing slashes,
// allow non-browser clients (no Origin header), and accept Vercel preview/prod
// deployments (*.vercel.app) without having to redeploy for every preview URL.
const normalizeOrigin = (o) => (o || '').replace(/\/+$/, '');
const allowedOrigins = env.allowedOrigins.map(normalizeOrigin);

const corsOptions = {
  origin(origin, callback) {
    // Same-origin / curl / server-to-server requests have no Origin header.
    if (!origin) return callback(null, true);

    const candidate = normalizeOrigin(origin);
    let isVercel = false;
    try {
      isVercel = new URL(origin).hostname.endsWith('.vercel.app');
    } catch {
      isVercel = false;
    }

    if (allowedOrigins.includes(candidate) || isVercel) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
// Ensure CORS preflight (OPTIONS) is answered for every route.
app.options('*', cors(corsOptions));

// Gzip responses for smaller payloads.
app.use(compression());

// Parse JSON and URL-encoded bodies (with a sane size cap).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Parse cookies (refresh token lives in an httpOnly cookie).
app.use(cookieParser());

/* ------------------------------- Static uploads ------------------------------ */

// Serve locally-stored uploads (dev fallback when Cloudinary isn't configured).
// CORP is relaxed so the frontend on another origin can load the images.
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

/* --------------------------------- Logging ---------------------------------- */

// HTTP request logging — concise in dev, combined in production.
app.use(morgan(env.isProd ? 'combined' : 'dev'));

/* ------------------------------- Rate limiting ------------------------------- */

// Global baseline limiter (API Spec §8.1: 100 req/min/IP). Stricter per-route
// limiters (login, search) are applied within their own routers later.
app.use(globalLimiter);

/* -------------------------------- Health check ------------------------------- */

// Liveness probe for uptime monitoring / deployment (Roadmap task 1.8).
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Image World API is healthy',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    },
  });
});

/* ------------------------------- Root & favicon ------------------------------ */

// Friendly API root — handy when hitting the server in a browser during dev.
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Image World API Running',
    version,
    environment: env.NODE_ENV,
  });
});

// Browsers auto-request /favicon.ico; respond 204 so it doesn't log as a 404.
app.get('/favicon.ico', (req, res) => res.status(204).end());

/* ---------------------------------- Routes ----------------------------------- */

// All feature routers mounted under /api/v1 (auth live; more added per phase).
app.use('/api/v1', apiRoutes);

/* ----------------------------- 404 & error handler --------------------------- */

// Any unmatched route → NOT_FOUND ApiError → error handler.
app.use(notFound);

// Centralized error funnel — must be the final middleware.
app.use(errorHandler);

module.exports = app;
