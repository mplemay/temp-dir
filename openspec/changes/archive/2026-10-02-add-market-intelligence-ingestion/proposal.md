# Proposal

## Why

The Tempus Sales Copilot prototype has no territory data, so it cannot yet say which oncologists to call or how large their eligible patient populations are. This change adds a validated market-intelligence ingest so later ranking, objection handling, and meeting scripts have a real provider universe instead of ad-hoc rows.

## What Changes

- Add a committed market-intelligence fixture for one mixed academic/community metro: a provider CSV (one row per ordering clinician) plus a small tumor-event CSV for “why now” hooks.
- Load those files at runtime, validate schema and identity (NPI), skip invalid rows with a report, and expose typed provider records.
- Derive opportunity features in code (`tempus_share`, `opportunity_patients`) from labeled volume estimates. Do not precompute a rank in the CSV.
- Keep commercial volume, share-of-wallet, and incumbent-lab fields synthetic and explicitly estimated. Product metrics (TAT, gene counts, CDx claims) stay out of this feed.

## Capabilities

### New Capabilities

- `market-intelligence`: Load, validate, and expose a territory of oncologists/providers with estimated patient populations, incumbent-lab context, and tumor-typed market events. Owns the ingest contract and derived opportunity features; does not own ranking or generated briefs.

### Modified Capabilities

- None. `app-shell` and `design-system` stay unchanged. This change does not add a user-facing route.

## Impact

- **Code**: New data files under a committed fixture path, plus a server-side loader/schema module (likely `src/lib/market-intelligence/`). No route or UI changes.
- **Data**: ~40–80 provider rows so a later ranked list is not 1:1 with CRM notes; 8–10 of those NPIs are reserved as join keys for a future CRM-notes change. One metro (Chicago-style mix of academic, community hospital, and independent practice).
- **Dependencies**: CSV parsing and schema validation (for example Zod). No Salesforce, CMS, or NPPES live APIs.
- **Out of scope**: Ranked provider list, objection handler, meeting script, product knowledge base, CRM notes ingest, file-upload UI, live CMS/NPI pulls, PHI.
- **Assumptions**: The user did not contradict the larger-territory recommendation from explore; if the fixture were only 8–10 rows matching CRM notes, ranking later would be circular. Identity may use realistic public org names; clinician commercial fields are always mock and labeled as estimates.
