# Proposal

## Why

The copilot still has no prior-interaction context, so later objection handling and meeting scripts would have to invent why a given clinician cares. Market intelligence already reserved eight NPIs as CRM join keys, and product knowledge already owns citable assay metrics. This change adds the missing notes feed so those later briefs can join relationship prose on NPI instead of hallucinating it.

## What Changes

- Add a committed CRM-notes CSV: one interaction note per reserved `reserved_for_crm` NPI, with `npi`, `note_date`, and free-text `body`.
- Load that file at runtime, validate identity and schema, skip invalid rows with a report, and expose typed note records.
- Keep join coverage as a committed-fixture test against market intelligence: every reserved NPI has at least one accepted note, and every accepted note NPI is reserved. Do not invent NPIs.
- Keep ranking, objection generation, meeting scripts, Salesforce, embeddings, structured concern taxonomies, and UI out of this change.

## Capabilities

### New Capabilities

- `crm-notes`: Load, validate, and expose mock prior-interaction notes keyed by NPI so later objection handling and meeting scripts can read relationship context. Owns the ingest contract; does not own generation, ranking, or provider identity.

### Modified Capabilities

- None. `market-intelligence` stays the owner of providers, `reserved_for_crm` keys, volume, and events; this change reads those reserved NPIs as a coverage invariant rather than changing that spec. `product-knowledge` stays the owner of assay performance claims. `app-shell` and `design-system` stay unchanged. This change does not add a user-facing route.

## Impact

- **Code**: New CSV under a committed fixture path, plus a server-side loader/schema module (likely `src/lib/crm-notes/`). No route or UI changes. No new runtime dependencies (`csv-parse` and Zod already exist).
- **Data**: Eight mock notes, one per reserved Chicago-territory NPI. Bodies are synthetic sales-interaction prose with an obvious concern and interest; they MUST NOT include patient identifiers, assay performance numbers, or volume/rank fields.
- **Dependencies**: None beyond existing CSV parsing and Zod.
- **Out of scope**: Ranked provider list, objection handler, meeting script, concern-type enums, Salesforce API, RAG/vector search, file-upload UI, attaching notes onto `AcceptedProvider`, PHI.
- **Assumptions**: Explore locked ingest-only, one note per reserved NPI, three columns (`npi`, `note_date`, `body`), and no structured concern field. Schema MAY accept multiple notes per NPI; the committed fixture is 1:1.
