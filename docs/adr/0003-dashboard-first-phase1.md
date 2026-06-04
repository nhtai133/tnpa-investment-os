# ADR 0003: Dashboard-First Approach for Phase 1

## Context

Phase 0 established the foundation: domain model, workflows, architecture baseline, and security requirements. Phase 1 required selecting the first user-facing implementation slice.

The original candidate slices were:

- Research thesis registry with decision log
- Portfolio holdings dashboard with exposure views
- Investment committee memo workflow
- Watchlist and catalyst tracking

The core use case for TNPA is personal multi-asset portfolio management across heterogeneous asset classes, including Stocks, Crypto, Cash, Mutual Funds, Private Loans, Opportunity Funds, and Other Assets. A thesis-first or memo-first entry point would require users to navigate deep into research workflows before seeing their actual portfolio state.

## Decision

Phase 1 will build toward a **Net Worth Command Center** dashboard as the primary user-facing surface.

The dashboard consolidates all asset classes into one view with the following sections:

- Total Net Worth card
- Asset Allocation donut chart (breakdown by asset class)
- Asset class summary cards
- Top Holdings table
- Recent Investment Decisions
- Watchlist
- Rebalance Alert section

Research thesis and decision records remain first-class domain objects. They surface as supporting data within the dashboard rather than as standalone entry screens. Users access thesis and decision detail from within the dashboard context.

The domain model has been updated to support this:

- `Asset` now carries a required `asset_class` field with the seven supported classes.
- `TargetAllocation`, `WatchlistItem`, `RebalanceAlert`, and `NetWorthSnapshot` have been added as explicit entities.
- Dashboard data flows are documented in the domain model.

## Consequences

- Schema design in Phase 1 must support aggregation by `asset_class` efficiently.
- `NetWorthSnapshot` should be generated on a schedule or triggered by position updates, not computed on every dashboard load.
- `RebalanceAlert` is a derived record; resolution requires a position change or target adjustment, not a manual status flip.
- The thesis and decision log UX will be scoped to Phase 3 as a dedicated workflow surface, after the dashboard foundation is in place.
- Seed data must cover all seven asset classes to make the dashboard meaningful during development.

## Status

Accepted — 2026-06-04
