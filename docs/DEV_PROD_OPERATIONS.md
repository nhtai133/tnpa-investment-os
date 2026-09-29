# Development and production operations

This repository is the only maintained source tree. Development occurs in `~/Developer/tnpa-investment-os`; production is a generated release copy under `~/Applications/TNPA-Wealth-OS/`. Never edit the production copy. Do not deploy an unapproved working tree.

## Environments

| | Development | Production |
|---|---|---|
| Runtime selector | `TNPA_ENV=development` | `TNPA_ENV=production` |
| Private root | `~/.tnpa-wealth-os-dev/` | `~/.tnpa-wealth-os/` |
| Database | `database/wealth.db` under that root | `database/wealth.db` under that root |
| URL | `http://127.0.0.1:3002` | `http://127.0.0.1:3001` |
| Data | Synthetic/test only | Personal wealth data |

Both listeners bind explicitly to loopback. Environment selection is mandatory. Remote database variables and a data root that does not exactly match the selected environment fail closed. Do not set `DATABASE_URL` manually; the launcher selects the canonical path. Runtime startup never falls back between roots.

## Development commands

From the repository:

```sh
npm run db:init-local
npm run dev
```

The initializer is schema-only and targets the development root. `npm run dev` automatically initializes a missing development database, but never production. Keep synthetic records in the dev DB only.

## Production deployment

Deployment accepts an annotated approved tag and requires a clean repository with `HEAD` exactly at that tag:

```sh
git checkout <approved-tag>
npm run deploy:local -- <approved-tag>
```

The deployment routine makes a timestamped production backup first, builds locally, copies only the standalone application/runtime assets into a versioned release directory, applies safe schema migrations without demo seeding, and atomically changes the `current` release pointer. It does not copy the development database, `.env` files, test data, or repository build cache. Production wealth data remains at `~/.tnpa-wealth-os/database/wealth.db`, outside the deployment tree. Deployment does not start the server automatically; inspect logs and then run:

```sh
~/Applications/TNPA-Wealth-OS/start.sh
```

Production startup binds only `127.0.0.1:3001`. The repository's `npm start` command is a guarded convenience that launches the installed release and fails if none is installed; it never runs the source checkout in production mode. Stop the server with Ctrl-C in its terminal. Do not run deployment from a dirty checkout or use the deployment folder as a development workspace.

## Updates, backup, rollback

Before every update, the deployment command verifies the production DB and writes a timestamped SQLite backup under `~/.tnpa-wealth-os/backups/`. Backups remain local and should be included in the user's independent Mac backup plan. A manual backup can be made with `npm run backup:production`.

Rollback changes the release pointer only; it does not roll back or replace the database:

```sh
~/Applications/TNPA-Wealth-OS/rollback.sh <previous-tag>
```

Keep the database backup made before the update. If a database restore is required, stop the application, preserve the current DB as another dated copy, validate the selected backup with SQLite integrity checks, then restore under explicit operator control. Never copy a development DB into production. Test any restore procedure against development first.

## Disaster recovery

Keep encrypted, access-controlled Mac backups of `~/.tnpa-wealth-os/` separate from source control. To recover, reinstall the approved release, restore the production data root from a verified local backup, check `PRAGMA integrity_check`, then start on loopback. Never place a real database, export, snapshot, log, or backup in the repository or upload it to a cloud service.

## Non-negotiable rule

Codex/Claude development is confined to the source repository and the synthetic development data root. Production is an immutable generated copy of an approved release. No direct production code edits, no real production data in development, and no cross-environment database access.
