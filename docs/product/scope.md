# Product Scope

TNPA Investment OS is an internal operating system for disciplined investment work. It should help a team capture research, make decisions, monitor portfolios, and learn from outcomes.

## In Scope

- Company, fund, asset, and instrument records.
- Research notes, source references, thesis snapshots, and open questions.
- Watchlists, catalysts, risks, and review dates.
- Portfolio, account, position, target allocation, and exposure tracking.
- Decision records for buy, sell, hold, trim, add, reject, and monitor actions.
- Investment committee memo preparation and approval state.
- Audit trails for material changes.
- Reporting primitives for portfolio reviews and decision history.

## Out of Scope for the Foundation

- Live trading.
- Broker custody workflows.
- Tax optimization.
- Client billing.
- Public marketing pages.
- Fully automated investment recommendations.
- Uncontrolled ingestion of third-party content without source tracking.

## Product Principles

- Every material decision should have a timestamp, owner, rationale, and evidence trail.
- Users should be able to distinguish data from interpretation.
- The system should preserve history instead of silently overwriting it.
- Workflows should support professional judgment without pretending uncertainty is solved.
- Reporting should expose assumptions and exceptions.

## Primary Users

- Analyst: researches opportunities, drafts theses, tracks sources, and updates watchlists.
- Portfolio manager: reviews opportunities, manages allocation, and owns portfolio decisions.
- Investment committee member: reviews memos, asks questions, and approves or rejects decisions.
- Operations/admin user: manages users, data quality checks, audit exports, and reference data.
