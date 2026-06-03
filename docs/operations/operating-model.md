# Operating Model

## Delivery Cadence

- Keep work organized around product slices.
- Every slice should define user, workflow, data touched, permissions, and acceptance criteria.
- Keep architecture decisions close to the work that requires them.

## Definition of Ready

A product slice is ready for implementation when it has:

- Target user.
- Workflow entry and exit points.
- Required domain entities.
- Permission expectations.
- Audit requirements.
- Success criteria.

## Definition of Done

A product slice is done when it has:

- Implemented behavior.
- Relevant tests.
- Updated documentation.
- Migration or data notes where applicable.
- Clear verification steps.

## Change Management

- Use ADRs for durable architecture decisions.
- Update the changelog for meaningful changes.
- Keep migrations and schema documentation aligned once application code exists.
- Prefer explicit deprecation over silent removal.
