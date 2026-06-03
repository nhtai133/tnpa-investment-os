# Architecture Baseline

The foundation does not require a specific application framework yet. The baseline defines the boundaries that future implementation should preserve.

## System Boundaries

### Product Application

User-facing application for research, decisions, portfolio monitoring, and reporting.

Expected responsibilities:

- Authentication and authorization.
- User workflows.
- Domain validation.
- Audit event creation.
- Read models for dashboards and reports.

### Data Store

Persistent storage for core domain entities, versioned judgment records, and audit events.

Expected responsibilities:

- Referential integrity.
- Transactional updates for decision workflows.
- Historical records.
- Query support for portfolio and research views.

### Ingestion Jobs

Background processes for market data, documents, and other external inputs.

Expected responsibilities:

- Source tracking.
- Idempotency.
- Error capture.
- Reconciliation with existing records.

### Reporting Layer

Exports and summaries for portfolio reviews, committee meetings, and audit needs.

Expected responsibilities:

- Reproducible report generation.
- Clear as-of dates.
- Separation of calculated values and written analysis.

## Architectural Requirements

- Role-based access control must be available before sensitive workflows are exposed.
- Material edits must produce audit events.
- Investment theses and decision records must be versioned or immutable after approval.
- External data must include provenance.
- Background jobs must be observable and retryable.
- Reports must show as-of dates and data freshness.

## Initial Implementation Direction

Recommended first implementation stack, pending Phase 1 confirmation:

- TypeScript for product code.
- PostgreSQL for relational domain data and audit records.
- A server-rendered web application for workflow-heavy UI.
- A migration tool for schema history.
- A test suite covering domain validation, permissions, and workflow transitions.

This is a recommendation, not a committed decision. Record the final stack choice in an ADR before scaffolding application code.
