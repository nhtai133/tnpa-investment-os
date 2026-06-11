# Deploying TNPA Investment OS to Vercel

## Overview

TNPA Investment OS is a Next.js 14 App Router application. It deploys cleanly to Vercel with one critical caveat: the default local SQLite database is **not compatible** with Vercel's serverless environment. You must migrate the database to a hosted LibSQL/Turso or Supabase Postgres instance before production use.

---

## Pre-deployment checklist

- [ ] Back up your local data (Settings → Export JSON backup)
- [ ] Set up a cloud database (Turso recommended — see below)
- [ ] Configure environment variables in Vercel dashboard
- [ ] Run `npm run build` locally to confirm no build errors
- [ ] Push to GitHub and connect repo to Vercel

---

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | LibSQL connection string (e.g. `libsql://your-db.turso.io?authToken=TOKEN`) |
| `APP_ENV` | Recommended | Set to `production` |
| `NEXT_PUBLIC_APP_NAME` | Optional | Defaults to `TNPA Investment OS` |

---

## Recommended database: Turso (LibSQL)

TNPA Investment OS uses `@libsql/client` which supports both local SQLite files and remote Turso databases with the same API — **no code changes needed**, only the `DATABASE_URL` env var changes.

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create a database
turso db create tnpa-investment

# Get connection URL and token
turso db show tnpa-investment --url
turso db tokens create tnpa-investment
```

Set `DATABASE_URL` in Vercel to:
```
libsql://tnpa-investment-<org>.turso.io?authToken=<token>
```

### Restore data from backup
After the cloud DB is set up, use the app's import feature (Settings → Import JSON backup) to restore your data.

---

## Deploy steps

1. Push your branch to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set environment variables (see table above)
4. Deploy — Vercel auto-detects Next.js

No `vercel.json` configuration is required.

---

## Running locally after cloning

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Run migrations (if needed)
npx tsx src/db/migrate-research-notes.ts
npx tsx src/db/migrate-watchlist-enhancements.ts

# 4. Start dev server
npm run dev
# → http://localhost:3001
```

Local mode uses `file:tnpa-investment.db` by default — no database setup required.

---

## Current limitations

| Limitation | Status |
|---|---|
| Local SQLite on Vercel | Not supported — data is ephemeral |
| Authentication | Not implemented (single-user, local-first) |
| Real-time sync | Not implemented |
| External market data | Not implemented |

---

## Health check

Visit `/system/health` after deployment to confirm the app is running and the database is connected.

---

## Backup before any deployment

Always export a full JSON backup before migrating or redeploying:

1. Open the app locally
2. Go to **Settings → Data Management**
3. Click **Export JSON Backup**
4. Save the file — it contains all assets, holdings, research notes, watchlist, and settings
