# v2.4 release verification

- 31 deterministic tests pass, including synthetic VAR A–E, 12B portfolio invariant, source de-duplication, partial/split assignment, archive/restore, zero net wealth, v2.3 additive migration, and complete v7 backup/restore.
- lint, typecheck, source-only security scan, diff whitespace check and production build pass.
- DEV routes exercised twice plus a delayed dashboard request: existing seven workspaces, capital allocation, broker active/archive views, and asset-class policy.
- Safari opens the new capital page. Automated domain tests cover policy validation and mutation invariants. This is not a claim of owner manual acceptance.
- No production fixture records. Synthetic financial scenarios use disposable SQLite databases outside the repository.
- Production gates require a newly verified SQLite backup, unchanged original row fingerprints, identical Net Worth / investable Net Worth, restrictive permissions, and repeated localhost route checks before release completion.

## Boundaries

- Financial Goals: minimal separate data model only; advanced goal planning/assignment UI deferred by spec.
- Custody-level classifications use the canonical aggregate asset identity, not independent classifications per wallet.
- Debt is proportionately attributed for the investable-net denominator; this is an analytical convention explained in UI/ADR.
- Existing portfolios start unassigned. The owner chooses whether to apply the editable policy template.
- Incomplete policy, unassigned/archived-purpose capital, or non-positive net wealth suspends scoring.
- JSON imports require complete v7 backups. Preserve historical SQLite backups and their matching releases.
- Opera same-origin compatibility is unchanged.
