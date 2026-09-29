# ADR 0005: Local-only wealth data

## Context

TNPA Investment OS is becoming a private family-office application for one Mac mini. Financial data must remain on that machine. The previous application supported a libSQL/Turso deployment path and its migration runner could seed demo financial records, making a clean and private local setup ambiguous.

## Decision

Use the existing Next.js architecture with the local SQLite-compatible libSQL driver. The canonical database is `~/.tnpa-wealth-os/database/wealth.db`; supported runtime commands bind to loopback. Database initialization applies schema only. Remote database configuration fails closed, and backup/import/export files remain under the private data root.

## Consequences

No cloud database, sync, remote authentication, or external service is needed at runtime. The repository is source-code-only, and private data stays outside it. The current product still requires manual valuations and rates. This ADR does not authorize redesign, dependency upgrades, deployment, or data migration to a new database technology.

## Status

Accepted for v2.1.5 local-only foundation.
