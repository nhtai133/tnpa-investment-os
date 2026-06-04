# Domain Model

The domain model defines the initial shared language. It is not a final database schema, but future schemas should map cleanly to these concepts.

## Entities

### Organization

Represents the TNPA operating context and owns users, portfolios, policies, and audit settings.

Key fields:

- `id`
- `name`
- `status`
- `created_at`

### User

Represents a person using the system.

Key fields:

- `id`
- `organization_id`
- `name`
- `email`
- `role`
- `status`

Initial roles:

- `admin`
- `portfolio_manager`
- `analyst`
- `committee_member`
- `viewer`

### Asset

Represents the economic subject of research or exposure.

Key fields:

- `id`
- `asset_class` — enum: `stock | crypto | cash | funds | private_loan | other` (exactly six classes; no additions without explicit approval)
- `purpose` — enum: `wealth_compounder | income_generator | liquidity_reserve | opportunity_capital | store_of_value | strategic_asset`
- `asset_type` — finer classification within the asset class (e.g. large-cap equity, stablecoin, money market)
- `name`
- `symbol`
- `current_value`
- `currency`
- `include_in_investment_net_worth` — boolean; false only for `other` class assets
- `include_in_total_net_worth` — boolean; true for all assets
- `country`
- `sector`
- `status`

`asset_class` drives dashboard aggregation and allocation logic. `purpose` drives the Asset Purpose Allocation view. `include_in_investment_net_worth` separates the two net worth metrics.

**Asset Purpose examples:**
- BTC → Wealth Compounder
- USDC → Liquidity Reserve
- Private Loan → Income Generator
- Land / Physical Gold → Store of Value

### Instrument

Represents a security or holding mechanism tied to an asset.

Key fields:

- `id`
- `asset_id`
- `instrument_type`
- `symbol`
- `exchange`
- `currency`
- `identifier`
- `status`

### Portfolio

Represents a managed collection of exposures.

Key fields:

- `id`
- `organization_id`
- `name`
- `base_currency`
- `strategy`
- `status`

### Account

Represents a source or container of holdings.

Key fields:

- `id`
- `portfolio_id`
- `name`
- `account_type`
- `base_currency`
- `status`

### Position

Represents a portfolio holding at a point in time.

Key fields:

- `id`
- `account_id`
- `instrument_id`
- `as_of_date`
- `quantity`
- `market_value`
- `cost_basis`
- `currency`
- `source`

### TargetAllocation

Represents the desired weight for an asset class or instrument within a portfolio.

Key fields:

- `id`
- `portfolio_id`
- `target_type` — enum: `asset_class | instrument`
- `asset_class` — populated when `target_type` is `asset_class`
- `instrument_id` — populated when `target_type` is `instrument`
- `target_weight` — percentage of total portfolio value
- `lower_band` — minimum acceptable weight before rebalance alert triggers
- `upper_band` — maximum acceptable weight before rebalance alert triggers
- `effective_at`
- `status`

### WatchlistItem

Represents an asset or instrument under active observation.

Key fields:

- `id`
- `portfolio_id`
- `asset_id`
- `instrument_id` — optional; watch at instrument level when set
- `added_by`
- `note` — latest observation or reason for watching
- `alert_flag` — boolean; set when a condition worth reviewing has been flagged
- `review_date` — optional date to revisit
- `status`

### RebalanceAlert

Represents a detected deviation between actual and target allocation that warrants attention.

Key fields:

- `id`
- `portfolio_id`
- `target_allocation_id`
- `actual_weight` — current weight at time of detection
- `target_weight` — copied from the target allocation record
- `deviation` — actual minus target, signed
- `severity` — enum: `within_band | minor | major`
- `detected_at`
- `resolved_at` — null until acknowledged or position is adjusted
- `status`

### NetWorthSnapshot

A point-in-time read model of total net worth and per-class breakdown. Created by the system when valuations are refreshed; never manually edited.

Key fields:

- `id`
- `portfolio_id`
- `as_of_date`
- `total_value`
- `currency`
- `breakdown` — JSON object keyed by `asset_class` with `{ value, weight, holding_count }`
- `created_at`

### Thesis

Represents a versioned investment view.

Key fields:

- `id`
- `asset_id`
- `owner_id`
- `version`
- `stance`
- `summary`
- `base_case`
- `upside_case`
- `downside_case`
- `key_risks`
- `status`
- `effective_at`

### Decision Record

Represents a material decision or non-action.

Key fields:

- `id`
- `portfolio_id`
- `asset_id`
- `instrument_id`
- `decision_type`
- `proposed_by`
- `approved_by`
- `status`
- `rationale`
- `decision_at`
- `effective_at`

### Source

Represents evidence used in research.

Key fields:

- `id`
- `source_type`
- `title`
- `publisher`
- `url`
- `retrieved_at`
- `license_notes`

### Audit Event

Represents a material system event.

Key fields:

- `id`
- `actor_id`
- `entity_type`
- `entity_id`
- `action`
- `occurred_at`
- `metadata`

## Important Relationships

- An `Asset` carries exactly one `asset_class` (of six), exactly one `purpose`, and can have many `Holdings`.
- A `TargetAllocation` is defined per `asset_class`; there are at most six active target allocations.
- A `RebalanceAlert` is derived from a `TargetAllocation` and current `Asset` values summed by class.
- A `WatchlistItem` monitors an `Asset` or named opportunity not yet held.
- A `NetWorthSnapshot` summarizes all `Asset.current_value` entries split by the two net worth metrics.
- **Investment Net Worth** = sum of `current_value` where `include_in_investment_net_worth = true` (Stock, Crypto, Cash, Funds, Private Loan).
- **Total Net Worth** = sum of all `current_value` where `include_in_total_net_worth = true` (all six classes).
- A `ResearchThesis` belongs to an `Asset` and is versioned.
- A `DecisionLog` entry may reference a `ResearchThesis` and an `Asset`.
- An `Audit Event` references the entity that changed and the actor responsible.

## Dashboard Data Flows

The Net Worth Command Center dashboard derives its sections as follows:

| Dashboard section | Primary entities |
|---|---|
| Investment Net Worth card | sum of `Asset.current_value` where `include_in_investment_net_worth = true` |
| Total Net Worth card | sum of all `Asset.current_value` |
| Investable Assets Ratio | Investment Net Worth ÷ Total Net Worth |
| Asset Allocation donut | `Asset` values grouped by `asset_class`, % of Investment Net Worth |
| Asset Purpose Allocation | `Asset` values grouped by `purpose`, % of Total Net Worth |
| Top Holdings table | `Asset` sorted by `current_value` descending |
| Recent Investment Decisions | `DecisionLog` ordered by `decision_date` descending |
| Watchlist | `WatchlistItem` where `status = active` |
| Rebalance Alerts | `RebalanceAlert` where `status = open` |

## Data Ownership Rules

- Source data must preserve origin and retrieval timing.
- Derived data must preserve formula or transformation version where practical.
- Judgment data must preserve author and version history.
- Audit data should be append-only.
- `NetWorthSnapshot` and `RebalanceAlert` are system-generated derived records; they must not be manually edited. Users resolve alerts by adjusting positions or targets.
