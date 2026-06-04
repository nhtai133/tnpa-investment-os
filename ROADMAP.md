# Roadmap

This roadmap keeps the project grounded in investment operations before implementation details. Dates should be added when work enters active planning.

## Phase 0: Foundation

Status: complete

- Define product scope, operating principles, and non-goals.
- Establish architecture baseline and decision record process.
- Document the initial investment domain model.
- Define core workflows for research, decisions, portfolio monitoring, and reviews.
- Set security, audit, and data governance expectations.

## Phase 1: Product Slice Definition

Status: in progress

Selected first slice: Net Worth Command Center.

The first visible surface is a personal net worth and portfolio dashboard that consolidates all asset classes into one command center view. Research, thesis, and decision workflows remain core domain objects but surface as supporting data within the dashboard rather than as the primary entry screen.

Asset classes in scope (exactly six):

- Stock
- Crypto
- Cash
- Funds
- Private Loan
- Other

Dashboard components to support:

- Total Net Worth card — aggregate market value across all accounts and asset classes.
- Asset Allocation donut chart — breakdown by asset class as percentage of total net worth.
- Asset class summary cards — per-class totals, holding count, and change indicators.
- Top Holdings table — largest positions by value with asset class, gain/loss, and portfolio weight.
- Recent Investment Decisions — latest decision records with action, asset, and date.
- Watchlist — monitored assets with last note and alert flags.
- Rebalance Alert section — positions or asset classes outside target allocation bands.

Phase 1 deliverables:

- Define target users and permission levels for the dashboard.
- Define acceptance criteria for each dashboard component.
- Choose the application stack and record the decision in an ADR.
- Convert the domain model into implementation-ready schemas covering all seven asset classes.
- Define seed data and fixture strategy for local development and dashboard testing.

## Phase 2: Application Foundation

Status: planned

- Scaffold the application workspace.
- Add authentication and role-based access boundaries.
- Implement database migrations and schema validation.
- Add local development, linting, formatting, and test commands.
- Create CI checks for type safety, tests, and documentation drift.

## Phase 3: Core Workflows

Status: planned

- Research notes and thesis versioning.
- Decision records with approvals and rationale.
- Portfolio positions, target weights, and exposure rollups.
- Review cycles, exceptions, and postmortems.
- Report export primitives.

## Phase 4: Integrations and Automation

Status: planned

- Market data ingestion.
- Document ingestion and source tracking.
- Alerting for watchlist events, allocation drift, and thesis review dates.
- Scheduled reporting.
- Admin audit views.

## Phase 5: Hardening

Status: planned

- Permission review and security testing.
- Backup, restore, and retention procedures.
- Observability and operational runbooks.
- Performance testing for portfolio and research queries.
- Release process and production readiness checklist.
