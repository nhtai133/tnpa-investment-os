# Investment Workflows

## Research Intake

Purpose: capture sources, notes, and open questions before they become a thesis.

1. Analyst creates or selects an asset.
2. Analyst attaches source records with provenance.
3. Analyst records notes and unresolved questions.
4. Analyst links catalysts and risks.
5. Analyst marks the research item as draft, ready for review, or archived.

Required controls:

- Sources must include origin and retrieval date where available.
- User-authored notes must preserve author and timestamp.
- Archived research should remain discoverable.

## Thesis Creation

Purpose: convert research into a versioned investment view.

1. Analyst drafts a thesis linked to an asset.
2. Analyst states stance, base case, upside case, downside case, risks, and review trigger.
3. Portfolio manager reviews and requests changes or marks ready for decision.
4. Approved thesis version becomes read-only.

Required controls:

- Approved thesis versions should not be silently edited.
- Superseding versions should link to prior versions.
- Thesis status should be visible in portfolio and decision views.

## Decision Workflow

Purpose: create an accountable record for material action or non-action.

1. User proposes a decision.
2. Proposal links to asset, instrument, portfolio, thesis, and evidence.
3. Required approver reviews rationale, risk, sizing, and constraints.
4. Decision is approved, rejected, deferred, or withdrawn.
5. Effective decision is included in monitoring and reporting.

Required controls:

- Decision status transitions must be explicit.
- Approved decisions should preserve approver and timestamp.
- Rejected and deferred decisions should preserve rationale.

## Portfolio Monitoring

Purpose: track exposures, allocation drift, risks, and review obligations.

1. Holdings are imported or entered with an as-of date.
2. System calculates exposure and allocation views.
3. Users review target weights, drift, concentration, and stale theses.
4. Exceptions become review tasks or decision proposals.

Required controls:

- Position data must identify source and as-of date.
- Calculated values must be distinguishable from entered values.
- Stale or missing thesis coverage should be visible.

## Review and Postmortem

Purpose: learn from decisions and keep assumptions current.

1. Review cycle identifies decisions, theses, and positions due for review.
2. Owner updates thesis status, risk assessment, and outcome notes.
3. Material changes trigger a new decision record where needed.
4. Postmortem captures what changed, what was missed, and what should be improved.

Required controls:

- Reviews should preserve prior assumptions.
- Postmortems should link to the original decision record.
- Missed review dates should be reportable.
