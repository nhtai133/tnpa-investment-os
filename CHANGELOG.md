# Changelog

All meaningful changes to TNPA Investment OS should be recorded here.

## v2.3 — Personal Wealth MVP (release candidate)

- Includes Crypto Workspace, existing wealth and tracking cutover, Banking, Stocks opening wealth, physical Gold, Real Estate / Land, and global Net Worth aggregation.
- Includes the current loopback-only DEV runtime on port 3100.
- Manual user acceptance testing: accepted by the owner in Safari.
- Known non-blocking DEV/browser compatibility issue: Opera currently receives `Local same-origin access only` when accessing the local DEV application. Safari access passes. Investigation is deferred to a future sprint; this release does not weaken the local same-origin security model or include an Opera compatibility fix.

## v2.1.5 — Local-only foundation

- Added schema-only, idempotent local database initialization at `~/.tnpa-wealth-os/database/wealth.db`; initialization and legacy migration entry points no longer insert demo records.
- Bound supported development/runtime commands to loopback and disabled Next.js telemetry; local database configuration fails closed instead of falling back to Turso.
- Moved backup, export, snapshots, and app settings such as wallet addresses into the private local data root; validated full-table imports and snapshot current data before restore.
- Unified bank-account and registry cash references, normalized portfolio balances to USD, and added regression coverage for cash aggregation and lifecycle accounting.
- Added local-only security documentation and ADR 0005.
- Validation: lint, build, local foundation tests, typecheck, and source-only check.

## 2026-06-05

- Built Phase 4: Holdings Registry (13 new files, 1 modified).
- Routes: /holdings, /holdings/new, /holdings/[id], /holdings/[id]/edit.
- Components: HoldingsStats, FilterTabs, HoldingsTable, PositionSummaryCard, AssetForm, DeleteAssetForm.
- Navigation: TopNav + NavLinks added to root layout (Dashboard | Holdings).
- Server Actions: createAsset, updateAsset, deleteAsset with revalidation and redirect.
- Filter tabs use URL searchParams with server-side filtering — no client state.
- Reuse AllocationChart and PurposeAllocation on /holdings for full portfolio views.

## 2026-06-04

- Phase 3 review: PASS. Tagged v0.3-net-worth-command-center.
- Roadmap updated to reflect actual phase progression. Phase 4 (Holdings + Transactions) set as next.
- Built Phase 1 MVP: Net Worth Command Center dashboard (Next.js 14, TypeScript, Tailwind, SQLite/Drizzle).
- Created all dashboard sections: Net Worth cards, Investable Assets Ratio, Asset Allocation donut, Asset Purpose allocation, Top Holdings, Recent Decisions, Watchlist, Rebalance Alerts.
- Corrected asset classes to exactly six: Stock, Crypto, Cash, Funds, Private Loan, Other.
- Added Asset Purpose Framework (six purposes: Wealth Compounder, Income Generator, Liquidity Reserve, Opportunity Capital, Store of Value, Strategic Asset).
- Added two-metric Net Worth framework (Investment Net Worth vs Total Net Worth).
- Added ADR 0004: technology stack (Next.js 14 + TypeScript + Tailwind + SQLite + Drizzle).
- Updated Phase 1 direction to Net Worth Command Center dashboard-first approach.
- Updated domain model: added `asset_class` to `Asset`; added `TargetAllocation`, `WatchlistItem`, `RebalanceAlert`, and `NetWorthSnapshot` entities; documented dashboard data flows.
- Updated product scope to declare Net Worth Command Center as the primary surface and enumerate the seven asset classes.
- Updated glossary with new terms: asset class, Net Worth Snapshot, Net Worth Command Center, target allocation, rebalance alert.
- Added ADR 0003: dashboard-first approach for Phase 1.

## 2026-06-03

- Created the project foundation.
- Added product scope, architecture baseline, domain model, workflows, security baseline, operating model, ADRs, and agent guidance.
