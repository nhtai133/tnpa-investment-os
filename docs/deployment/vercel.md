# Deploying TNPA Investment OS to Vercel

TNPA Investment OS (v2.0) is a Next.js 14 App Router application. It deploys cleanly to Vercel with Turso as the cloud database.

> **Critical:** The local SQLite file (`tnpa-investment.db`) is **not compatible** with Vercel's serverless environment — each function invocation gets a fresh filesystem. You must use Turso Cloud.

---

## Pre-deployment checklist

- [ ] Back up your local data (Settings → Export JSON Backup)
- [ ] Create a Turso database and note the URL + auth token
- [ ] Run `npm run db:migrate` with Turso vars set to initialise the cloud schema
- [ ] Import your backup JSON into the cloud instance
- [ ] Push to GitHub and connect repo to Vercel
- [ ] Set environment variables in the Vercel dashboard
- [ ] Deploy and verify `/system/production` passes all checks

---

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | **Yes** | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | **Yes** | Token from `turso db tokens create` |
| `APP_ENV` | Recommended | Set to `production` |
| `NEXT_PUBLIC_APP_NAME` | Optional | Defaults to `TNPA Investment OS` |

---

## Step-by-step deployment

### 1. Back up local data

```bash
npm run dev
# Open http://localhost:3001/settings
# Settings → Data Management → Export JSON Backup
# Save the .json file safely
```

### 2. Create Turso database

```bash
brew install tursodatabase/tap/turso
turso auth login
turso db create tnpa-investment-os
turso db show tnpa-investment-os          # copy the URL
turso db tokens create tnpa-investment-os # copy the token
```

### 3. Initialise cloud schema

Add to `.env.local`:
```env
TURSO_DATABASE_URL=libsql://tnpa-investment-os-<org>.turso.io
TURSO_AUTH_TOKEN=<your-token>
APP_ENV=production
```

Then run:
```bash
npm run db:migrate
```

All 14 tables are created. Output ends with:
```
[5/5] Done — all migrations applied.
```

### 4. Import your backup

```bash
npm run dev
# Open http://localhost:3001/settings
# Settings → Data Management → Import JSON Backup
# Select your .json backup file
# Verify data at /holdings, /watchlist, /performance
```

### 5. Deploy to Vercel

```bash
# Push your branch to GitHub, then:
# 1. Import repo at vercel.com
# 2. Set env vars (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, APP_ENV)
# 3. Deploy — Vercel auto-detects Next.js
```

No `vercel.json` is required.

### 6. Verify production

After deployment:
- Visit `https://your-app.vercel.app/system/health`
  - **Mode**: Turso Cloud ✓
  - **Auth Token**: Configured ✓
  - **Deploy Readiness**: Cloud-ready ✓
- Visit `https://your-app.vercel.app/system/production`
  - All checklist items should show ✓

### 7. Install as PWA

On mobile:
1. Open `https://your-app.vercel.app` in Safari (iOS) or Chrome (Android)
2. Tap Share → Add to Home Screen
3. App installs as "TNPA Wealth OS" with the indigo icon

---

## Running locally after cloning

```bash
# 1. Install dependencies
npm install

# 2. Copy env template (local mode — no Turso needed)
cp .env.example .env.local   # if it exists, otherwise skip

# 3. Run migrations
npm run db:migrate

# 4. Start dev server
npm run dev
# → http://localhost:3001
```

Local mode uses `file:tnpa-investment.db` by default — no database setup required.

---

## Rollback to local SQLite

Clear the Turso vars in `.env.local`:
```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Restart the dev server. The app reverts to `file:tnpa-investment.db` automatically.

---

## Backup schema (v4)

The JSON backup includes all tables:

| Key | Table |
|---|---|
| `assets` | Portfolio holdings |
| `app_settings` | FX rates, bucket schedules, targets |
| `asset_intelligence` | Per-asset research notes |
| `decision_logs` | Investment decisions |
| `decision_reviews` | Decision outcomes |
| `watchlist_items` | Watchlist entries |
| `opportunities` | Pipeline opportunities |
| `research_notes` | Research notes |
| `transactions` | Transaction history |
| `wealth_snapshots` | Performance snapshots |

---

## Current limitations

| Limitation | Status |
|---|---|
| Authentication | Not implemented — single-user, personal use only |
| Multi-user accounts | Not planned for v2.x |
| Real-time sync | Not implemented |
| Broker integration | Not implemented |
| Automatic market pricing | Not implemented — all values entered manually |

---

## Health and diagnostics

| Route | Purpose |
|---|---|
| `/system/health` | DB mode, auth token, deploy readiness |
| `/system/production` | Full production checklist |
| `/settings` | Version, environment, data management |
