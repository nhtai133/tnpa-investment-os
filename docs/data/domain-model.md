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
- `asset_type`
- `name`
- `country`
- `sector`
- `status`

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

- An `Asset` can have many `Instruments`.
- A `Portfolio` can have many `Accounts`.
- An `Account` can have many `Positions`.
- A `Thesis` belongs to an `Asset` and is versioned.
- A `Decision Record` may reference a `Thesis`, `Asset`, `Instrument`, and `Portfolio`.
- A `Source` can support many research notes, theses, and decision records.
- An `Audit Event` references the entity that changed and the actor responsible.

## Data Ownership Rules

- Source data must preserve origin and retrieval timing.
- Derived data must preserve formula or transformation version where practical.
- Judgment data must preserve author and version history.
- Audit data should be append-only.
