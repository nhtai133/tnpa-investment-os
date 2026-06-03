# Security and Compliance Baseline

This baseline defines minimum expectations before sensitive investment data is stored in the system.

## Access Control

- Authenticate all users.
- Authorize access by organization, role, and workflow.
- Deny by default for administrative, approval, export, and audit views.
- Preserve disabled users for historical attribution.

## Auditability

Audit events should be created for:

- User and permission changes.
- Material entity creation, update, archive, and deletion.
- Thesis approval and supersession.
- Decision proposal, approval, rejection, withdrawal, and execution marking.
- Position import and reconciliation.
- Report export.

## Data Protection

- Store secrets outside the repository.
- Avoid committing raw proprietary data, client data, credentials, or licensed data.
- Track source provenance for external content and market data.
- Define retention and deletion policies before production use.

## Workflow Controls

- Approved theses and decisions should be immutable or superseded by later records.
- Permission checks should run server-side.
- Exports should include user, timestamp, as-of date, and data freshness.
- Automation must never make investment decisions without explicit human approval.

## Production Readiness Gates

Before production:

- Role and permission matrix documented.
- Backup and restore tested.
- Audit event coverage tested.
- Secrets management in place.
- Data provider terms reviewed.
- Incident response process documented.
