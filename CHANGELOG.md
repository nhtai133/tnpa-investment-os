# Changelog

All meaningful changes to TNPA Investment OS should be recorded here.

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
