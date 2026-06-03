# ADR 0001: Use Architecture Decision Records

Status: accepted

## Context

TNPA Investment OS will involve decisions about product scope, data ownership, security controls, market data ingestion, and application architecture. These choices need to remain visible over time.

## Decision

Use architecture decision records under `docs/adr/` for durable technical and product architecture decisions.

Each ADR should include:

- Status
- Context
- Decision
- Consequences

## Consequences

- Decisions have a stable place in the repository.
- Future contributors can understand why a choice was made.
- Reversals and superseded decisions should be documented instead of silently erased.
