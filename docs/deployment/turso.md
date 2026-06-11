# Turso Cloud Database Setup

TNPA Investment OS uses `@libsql/client`, which speaks the same protocol for both local SQLite files and Turso remote databases. Switching to Turso requires only two environment variables — no code changes.

---

## 1. Install Turso CLI

```bash
# macOS
brew install tursodatabase/tap/turso

# Or via curl
curl -sSfL https://get.tur.so/install.sh | bash
```

## 2. Login

```bash
turso auth login
```

## 3. Create a database

```bash
turso db create tnpa-investment-os
```

## 4. Get the database URL

```bash
turso db show tnpa-investment-os
```

Copy the `URL` value — it looks like:
```
libsql://tnpa-investment-os-<org>.turso.io
```

## 5. Create an auth token

```bash
turso db tokens create tnpa-investment-os
```

Copy the token output (shown once, save it securely).

---

## 6. Configure environment variables

### Local development with Turso

Add to your `.env.local`:

```env
TURSO_DATABASE_URL=libsql://tnpa-investment-os-<org>.turso.io
TURSO_AUTH_TOKEN=<your-token>
```

Leave `DATABASE_URL=file:tnpa-investment.db` as the fallback.

### Vercel production

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://tnpa-investment-os-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | `<your-token>` |
| `APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `TNPA Investment OS` |

---

## 7. Push schema to Turso

With the env vars set, push your Drizzle schema:

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push
```

Or if `.env.local` is configured:

```bash
npm run db:push
```

---

## 8. Export local data before migrating

**Always export a backup before switching databases.**

1. Start the app locally (pointing to local SQLite):
   ```bash
   npm run dev
   ```
2. Go to **Settings → Data Management → Export JSON Backup**
3. Save the file

---

## 9. Import data into Turso

1. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`
2. Restart the dev server: `npm run dev`
3. Go to **Settings → Data Management → Import JSON Backup**
4. Select the backup file from step 8
5. Verify data in `/holdings`, `/research`, `/watchlist`

---

## 10. Verify on the health page

Visit `/system/health` and confirm:

- **Mode**: `Turso Cloud`
- **Auth Token**: `Configured`
- **Deploy Readiness**: `Cloud-ready`

---

## Rollback to local SQLite

Remove or blank out the Turso vars in `.env.local`:

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Restart the dev server. The app falls back to `file:tnpa-investment.db` automatically.

---

## Connection resolution order

| Priority | Variable | Used when |
|---|---|---|
| 1 | `TURSO_DATABASE_URL` | Set and non-empty → Turso Cloud |
| 2 | `DATABASE_URL` | Set (and `TURSO_DATABASE_URL` blank) → custom libSQL or local |
| 3 | *(automatic)* | `file:tnpa-investment.db` — dev default |

---

## Security notes

- Never commit `.env.local` (it is gitignored)
- Never put `TURSO_AUTH_TOKEN` in client-side code or logs
- The health page shows `Configured` / `Not set` only — token value is never displayed
- Rotate tokens via `turso db tokens create <db-name>` if compromised
