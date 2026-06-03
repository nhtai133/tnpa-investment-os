# Agent Instructions

This repository is the foundation for TNPA Investment OS. Future agents should protect the product intent, auditability requirements, and domain language already documented here.

## Before Editing

- Read [README.md](README.md), [ROADMAP.md](ROADMAP.md), and the relevant docs under `docs/`.
- Check `git status --short` and do not overwrite unrelated user changes.
- If adding a technical decision, create or update an ADR under `docs/adr/`.
- If adding product behavior, update the relevant workflow or domain documentation.

## Engineering Standards

- Keep implementation choices aligned with documented architecture boundaries.
- Prefer small, testable product slices over broad scaffolding.
- Keep factual data, calculated data, and user-authored judgment separate in code and storage.
- Make permission and audit behavior explicit in schemas and service boundaries.
- Do not introduce market-data providers, broker integrations, or AI workflows without documenting data provenance, failure modes, and user controls.

## Documentation Standards

- Use direct, operational language.
- Keep domain terms consistent with [docs/product/glossary.md](docs/product/glossary.md).
- Update [CHANGELOG.md](CHANGELOG.md) for meaningful foundation, architecture, or product changes.
- Record durable technical decisions in ADR format:
  - Context
  - Decision
  - Consequences
  - Status

## Quality Bar

Before finishing a change, run the most relevant checks available in the repo. If no automated checks exist yet, state that clearly and verify the changed files by inspection.
