# ADR 0008 — Capital allocation classification

Status: accepted for v2.4.

## Context

Legacy asset `purpose` mixed strategy, goals and inferred liquidity. Custody rows represent locations, not additional economic assets. Archived brokerage accounts must remain economically counted.

## Decision

- Add `capital_purposes`, `capital_allocations`, and minimal `financial_goals`. Keep legacy fields for compatibility/history; never automatically reinterpret them. No goal assignment/planning UI in v2.4.
- Assign percentages to canonical `asset`, `registry`, `bank-account`, or `savings-deposit` identities used by the existing portfolio model. Stock/crypto purposes follow the aggregate economic asset across custody transfers. Custody-specific purpose splits are not supported.
- Allocation uses the existing Investment Net Worth flag and valuation. Positive investable source values are scaled by net investable wealth / gross investable assets to attribute liabilities proportionately for reporting only. This is an analytical convention, never a repayment or transaction. Excluded assets and debt adjustment are visible. Non-positive net wealth has no meaningful percentages or score.
- No assignment is inferred from liquidity, old purposes or asset class. Inactive purposes retain IDs and assignments; existing assigned amounts remain visible but score is suspended until reclassified/reactivated.
- Targets are not normalized. Configuration must total 100%. Score is 25 × share of active purposes inside min/max, only when policy, classification, and positive denominator are complete. Target drift inside a band does not reduce score. No automatic buy/sell guidance.
- Fresh schema gets six editable policy definitions only. Existing DB migration creates no policy or assignments; owner explicitly applies the template. Template reset retains all IDs/assignments and archives custom purposes.
- Broker archive sets nullable `archived_at`, leaves status/balances/positions/history unchanged, hides operational choices, and blocks new trading until restored. There is no physical brokerage deletion endpoint.
- JSON backup version 7 includes all new tables. Incomplete older JSON backups fail closed; historical SQLite backups remain usable with their matching release. Validation checks classification references and totals before any replacement.

## Consequences

Classification never changes economic records. Older application code can use the additive schema without dropping new data, but old backup/import code must not be used to replace a v2.4 database. Legacy bucket pages redirect to the new page; asset-class policy editing remains available at `/rebalancing`.
