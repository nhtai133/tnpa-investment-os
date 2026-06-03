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

Status: next

- Select the first user-facing workflow to implement.
- Define target users, permissions, acceptance criteria, and reporting needs.
- Choose the application stack.
- Convert the domain model into implementation-ready schemas.
- Define seed data and fixture strategy for local development.

Candidate first slices:

- Research thesis registry with decision log.
- Portfolio holdings dashboard with exposure views.
- Investment committee memo workflow.
- Watchlist and catalyst tracking.

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
