# TNPA Investment OS

TNPA Investment OS is the operating foundation for investment research, portfolio oversight, and decision accountability. The project starts with the domain model, governance rules, and architecture constraints that future product surfaces should follow.

This repository is intentionally foundation-first. Application code should be added only after the core workflows, data contracts, and control requirements are clear enough to keep investment decisions auditable.

## Objectives

- Maintain one source of truth for companies, instruments, portfolios, positions, theses, decisions, and review cycles.
- Make investment work traceable from research input to decision, allocation, monitoring, and postmortem.
- Separate factual market data, analyst judgment, and committee approvals.
- Support repeatable workflows without hiding risk assumptions or unresolved questions.
- Build toward a modular product that can support web UI, automation jobs, data ingestion, and reporting.

## Current Foundation

- Product scope and non-goals: [docs/product/scope.md](docs/product/scope.md)
- Domain model: [docs/data/domain-model.md](docs/data/domain-model.md)
- Architecture baseline: [docs/architecture/baseline.md](docs/architecture/baseline.md)
- Operating workflows: [docs/workflows/investment-workflows.md](docs/workflows/investment-workflows.md)
- Security and compliance baseline: [docs/security/security-baseline.md](docs/security/security-baseline.md)
- Architecture decisions: [docs/adr](docs/adr)
- Roadmap: [ROADMAP.md](ROADMAP.md)

## Repository Layout

```text
.
├── docs/
│   ├── adr/              Architecture decision records
│   ├── architecture/     System boundaries and technical direction
│   ├── data/             Domain objects, data ownership, and contracts
│   ├── operations/       Delivery and runbook practices
│   ├── product/          Scope, personas, and product principles
│   ├── security/         Access, audit, privacy, and control requirements
│   └── workflows/        Investment operating workflows
├── AGENT_INSTRUCTIONS.md Guidance for future coding agents
├── CHANGELOG.md         Project history
├── README.md            Project overview
└── ROADMAP.md           Delivery plan
```

## Working Principles

- Prefer explicit records over implicit process.
- Treat auditability as a product requirement, not an afterthought.
- Keep market data, derived metrics, and human judgment distinguishable.
- Design for permissioned collaboration from the start.
- Avoid premature framework commitments before the product surface is defined.

## Status

Foundation created on 2026-06-03. The repo is ready for the next step: selecting the first implementation slice and choosing the application stack.
