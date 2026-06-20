# AI Image World — Deployment Guide

Production setup: **frontend on Vercel**, **backend on Render**, **database on
MongoDB Atlas**, **media on Cloudinary**.

```
Browser ──▶ Vercel (React/Vite static) ──▶ Render (Express API) ──▶ Atlas (MongoDB)
                                                     └────────────▶ Cloudinary (images)
```

---

## 1. Prerequisites

- **MongoDB Atlas** cluster + connection string (`MONGO_URI`).
- **Cloudinary** account → cloud name, API key, API secret.
- Two strong JWT secrets (32+ chars each):
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

---

## 2. Backend → Render

1. Push this repo to GitHub.
2. Render → **New + → Blueprint**, select the repo. It reads [`render.yaml`](./render.yaml)
   and creates the `ai-image-world-api` web service (`rootDir: server`,
   `npm install` / `npm start`, health check `/health`).
3. Set the secret env vars (marked `sync: false`): `MONGO_URI`,
   `CLOUDINARY_*`, `CLIENT_ORIGIN` (your Vercel URL), `SEED_ADMIN_EMAIL`,
   `SEED_ADMIN_PASSWORD`. JWT secrets are auto-generated.
4. Deploy. Verify: `https://<service>.onrender.com/health` → `{ "status": "ok" }`.
5. **Seed** the database (Render Shell, or locally with prod env):
   ```bash
   npm run seed:admin     # first superadmin only
   npm run seed:content   # 20 categories + 100 images + demo analytics
   ```

> Atlas: allow Render's egress IPs (or `0.0.0.0/0` for the free tier).

---

## 3. Frontend → Vercel

1. Vercel → **Add New → Project**, import the repo, set **Root Directory** to
   `client`. [`client/vercel.json`](./client/vercel.json) supplies the Vite
   preset + SPA rewrites.
2. Add env var **`VITE_API_URL`** = `https://<service>.onrender.com/api/v1`.
3. Deploy. Build command `npm run build`, output `dist`.

---

## 4. Connect the two

- On Render, set **`CLIENT_ORIGIN`** to the exact Vercel origin
  (e.g. `https://ai-image-world.vercel.app`). This enables CORS **and** the
  cross-site secure refresh cookie (`SameSite=None; Secure` in production).
- Multiple origins are comma-separated.
- Redeploy the backend after changing it.

---

## 5. Post-deploy checklist

- [ ] `/health` returns ok on Render.
- [ ] Public site loads images from the API (not empty) after seeding.
- [ ] `/signin` with the seeded admin works; `/admin` loads.
- [ ] Image upload in the Upload Center succeeds (Cloudinary configured).
- [ ] **Change the default admin password** (Settings → Change Password).
- [ ] JWT secrets are unique and not the dev defaults.

---

## 6. Local development

```bash
# backend
cd server && npm install && npm run dev          # or dev:memory (ephemeral DB)
npm run seed:content                             # populate data

# frontend
cd client && npm install && npm run dev          # proxies /api → :5000
```

Default seeded admin: `admin@aiimageworld.com` / `Admin@12345` (dev only).
