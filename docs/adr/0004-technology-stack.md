# ADR 0004: Technology Stack for Phase 1

## Context

Phase 1 requires selecting an application stack before scaffolding code. The stack must support a server-rendered dashboard, a relational data store, type-safe data access, and a premium UI — without introducing unnecessary complexity at the MVP stage.

Key constraints:

- Local-first development with no external service dependencies.
- Type safety from database schema to component props.
- Minimal operational overhead for a single-developer build phase.
- Must run on port 3001 (port 3000 reserved for TNPA Trading OS).

## Decision

**Next.js 14 (App Router)** — Server components reduce round-trips for dashboard data fetching. App Router enables server-side database access without a separate API layer for the MVP.

**TypeScript (strict)** — Enforces type safety across schema, calculations, and component boundaries.

**Tailwind CSS** — Utility-first styling supports the premium dark dashboard aesthetic without a component library dependency.

**SQLite via better-sqlite3** — Zero-config local relational database. No server process, no connection pooling, no cloud dependency. Sufficient for a personal family office operating system.

**Drizzle ORM** — Type-safe schema definitions that mirror TypeScript types exactly. `drizzle-kit push` for local schema sync; migrations added when team or prod deployment is introduced.

**Recharts** — Declarative chart library for the allocation donut chart. Client component boundary kept to chart components only.

## Consequences

- `better-sqlite3` is a native module; it must be listed in `serverExternalPackages` to avoid Next.js bundle issues.
- Database file (`tnpa-investment.db`) lives at project root; must be excluded from git.
- Seed script runs via `tsx` outside the Next.js runtime; database path must resolve from `process.cwd()`.
- If the product requires multi-user access or a production deployment, PostgreSQL migration is the natural next step — Drizzle ORM supports this with minimal schema changes.
- Port 3001 is configured in package.json scripts, not in next.config.

## Status

Accepted — 2026-06-04
