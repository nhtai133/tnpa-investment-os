# ADR 0002: Establish Foundation Before Framework

Status: accepted

## Context

The repository began without application code. TNPA Investment OS covers investment workflows where incorrect assumptions about data ownership, auditability, and permissions would be expensive to unwind.

## Decision

Start with documentation for product scope, workflows, domain model, security baseline, and architecture boundaries before selecting an application framework.

## Consequences

- The project can select a stack based on the first implementation slice.
- Contributors have shared vocabulary before schemas and UI are created.
- The next step is to choose a specific product slice and record the stack decision in a new ADR.
