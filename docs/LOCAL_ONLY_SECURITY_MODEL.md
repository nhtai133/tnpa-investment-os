# Local-only security model

## Threat model

This release is intended for one trusted macOS user on one Mac mini. It protects private records from accidental source-control inclusion, accidental LAN exposure, and automatic use of remote database services. It does not protect data from a compromised macOS account, malware running as that user, physical access to an unlocked Mac, or a future application vulnerability. Use FileVault and a protected macOS account; keep macOS and dependencies maintained.

## Data locations and GitHub boundary

Development data lives under `~/.tnpa-wealth-os-dev/` and must contain synthetic records only. Production data lives under `~/.tnpa-wealth-os/`; its database is `database/wealth.db`, with `snapshots/`, `exports/`, `backups/`, and `logs/` alongside it. The runtime requires explicit `TNPA_ENV=development` or `TNPA_ENV=production`; the chosen root is derived from that value, mismatches are rejected, and there is no fallback between roots. Directories are created with mode `0700`, database files with mode `0600`, and symlinked paths are rejected. The repository at `~/Developer/tnpa-investment-os` is source code only. Git ignore rules and the pre-commit source-only check block common private data, export, database, and secret artifacts. GitHub may receive reviewed source code; it must never receive real financial records, secrets, backups, exports, or snapshots.

## Database handling

The normal runtime uses the local SQLite-compatible `@libsql/client/sqlite3` driver and only the canonical database path. `DATABASE_URL` must point to that exact local file. Legacy Turso URL/token variables and remote or alternate database URLs cause startup to fail; there is no cloud fallback. Run `npm run db:init-local` to create or add missing schema without demo records. Before changing or importing existing records, create and verify a private backup. Import requires an explicit replacement confirmation, validates the complete supported format in a staging database, and writes a complete pre-import backup before replacing rows.

Exports and backups are written under the private root. They are not sent to a browser download endpoint or external service; the local UI presents the path. Treat all such files as sensitive and keep them out of Git and support reports.

## Network behavior

The supported `npm run dev` command uses the development root and binds to `127.0.0.1:3002`. The production launcher uses only the production root and binds to `127.0.0.1:3001`. Requests reject foreign hosts, origins, forwarded hosts, and cross-site mutations. The application contains no required external API, analytics, telemetry, webhook, cloud database, remote authentication, or sync connection. Next.js telemetry is disabled by the supported command wrapper. User-entered research URLs are stored as text and are not fetched by the application. Browser navigation to such links can contact their destination; that is an explicit user action and is outside automatic wealth-data processing.

The local-only assumption covers the supported local commands. Do not expose the development server through a reverse proxy, tunnel, port forward, or alternate host binding. Dependencies may contact package registries during manual installation/update, and Git commands may contact GitHub; these are development operations, not runtime data services.

## Backups and recovery

Keep backup files under the private root and maintain a separate encrypted offline copy if desired. A backup contains the full wealth database and must be handled with the same care as the database. Restore is destructive by design after confirmation, but it validates before mutation and snapshots current data first. Confirm backup readability and keep the pre-import backup until the restored database has been reviewed.

## Future Tauri packaging

Tauri should keep the database under the same user-private data root, request only the filesystem permissions needed for that directory, and package the Next.js interface without opening a LAN listener. The desktop shell must not add remote authentication, automatic update data uploads, analytics, cloud sync, remote image/font loading, or unrestricted network plugins. Any future AI-assisted feature must be opt-in and must state exactly which data leaves the Mac; private records remain local by default.
