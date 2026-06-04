# Roadmap

## Phase 0: Foundation

Status: complete

- Product scope, operating principles, and non-goals.
- Architecture baseline and ADR process.
- Domain model, workflows, security baseline, and operating model.

## Phase 1: Product Slice Definition

Status: complete

- Selected Net Worth Command Center as first slice.
- Defined six asset classes, Asset Purpose Framework, and two-metric net worth model.
- Chose application stack: Next.js 14, TypeScript, Tailwind, SQLite, Drizzle ORM.
- Recorded stack decision in ADR 0004.

## Phase 2: Application Foundation

Status: complete

- Scaffolded Next.js 14 App Router workspace.
- Implemented Drizzle ORM schema with all seven tables.
- Configured SQLite via @libsql/client (no native compilation required).
- Added seed data covering 12 assets, 5 decisions, 4 watchlist items, 2 rebalance alerts.
- Linting, type checking, and production build verified.

## Phase 3: Net Worth Command Center

Status: complete — v0.3-net-worth-command-center

- Investment Net Worth card
- Total Net Worth card
- Investable Assets Ratio card
- Asset Allocation donut chart (by asset class, % of Investment Net Worth)
- Asset Purpose Allocation (by purpose, % of Total Net Worth)
- Top Holdings table with unrealized gain/loss
- Recent Investment Decisions feed
- Watchlist Summary with alert flags
- Rebalance Alerts with band visualisation

## Phase 4: Holdings + Transactions

Status: next

Scope to be defined. Candidate deliverables:

- Holdings detail view per asset (cost basis, quantity, entry date, current price).
- Transaction log (buy, sell, add, trim, transfer) with date, price, quantity, and fees.
- Running cost basis and unrealized P&L per holding.
- Transaction entry form (manual input, no broker integration).
- Holdings history chart (value over time per asset or class).

## Phase 5: Research + Decision Workflows

Status: planned

- Research thesis creation and versioning.
- Decision log with approval state and rationale.
- Thesis linked to holdings and decision records.
- Postmortem workflow for closed positions.

## Phase 6: Integrations and Automation

Status: planned

- Market data ingestion (price updates for stocks, crypto, funds).
- Watchlist alerts and catalyst tracking.
- Scheduled rebalance alert generation.
- Report export primitives.

## Phase 7: Hardening

Status: planned

- Authentication and role-based access.
- Audit trail for material changes.
- Backup, restore, and data retention.
- Performance testing for portfolio queries.
- Production readiness checklist.
