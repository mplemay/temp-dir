# Proposal

## Why

The three sidebar feeds are list-only tables, so a judge cannot inspect an assay body, an event why-now, or a CRM thread without reading source files. The lists already hide the interesting fields, and the CRM fixture is eight one-sentence notes — too thin for a note page to be worth opening.

## What Changes

- Add per-record detail pages for assays (`/product-knowledge/$testId`), market events (`/market-intelligence/$eventId`), and CRM notes (`/crm/$noteId`). Unknown ids use the existing not-found page.
- Make browse-table rows links. Product rows open the assay page. Event rows open the event page. CRM rows open the note page. Market-intelligence **provider** rows open the existing copilot brief at `/providers/$npi` (every accepted provider is already ranked). Do not add a second raw-territory provider page.
- Show full committed fields on those detail pages: assay markdown body, aliases, and provenance; event date, why-now, and relevant tests joined to assays; note channel, clinician, and sibling notes for the same NPI. Unpublished TAT and gene count stay blank. Related assays on the provider brief become the same assay links.
- Expand the CRM fixture: require a unique `note_id` and a `channel` (`call`, `in_person`, `email`); keep the eight reserved NPIs; add follow-up notes so each reserved clinician has a short visit history. New bodies extend the existing concern/interest story and still omit PHI and numeric assay claims.
- Do not re-rank providers or regenerate briefs. Extra notes join at read time onto CRM pages and provider briefs. Ranked `readiness` / `concern` / `interest` stay as committed.

## Capabilities

### New Capabilities

- None. Detail pages belong on the app shell and design system. Assay and event identity already live on product-knowledge and market-intelligence. CRM schema and fixture volume belong on `crm-notes`.

### Modified Capabilities

- `app-shell`: Browse pages open detail routes. Adds assay, event, and CRM-note pages. Market-intelligence providers link to the existing brief route (replaces “MUST NOT open a per-provider detail route”). Brief related-assay rows open product pages.
- `design-system`: Assay, event, and CRM-note pages compose from shared table, badge, and link primitives rather than stacked cards.
- `crm-notes`: Notes gain unique `note_id` and `channel`. The committed fixture includes multiple notes per reserved NPI. Lookup by `note_id`. Coverage of reserved NPIs still holds.

## Impact

- **Code**: Nested file routes under `src/routes/product-knowledge/`, `src/routes/market-intelligence/`, and `src/routes/crm/`. New per-id server functions in `src/lib/browse/server.ts`. Browse tables and the brief related-assays table become `Link`s. CRM Zod schema, skip report, and fixture tests change with the new columns and row count.
- **Feeds**: `src/data/crm-notes/notes.csv` is the only fixture rewrite. No new assays, events, or providers. No edits to ranked-providers or provider-briefs artifacts.
- **UI**: Reuse existing `Table`, `Badge`, `Separator`, and `Link`. No new shadcn primitive. Assay bodies render as committed prose, not a new markdown engine.
- **Out of scope**: A second market-intelligence provider page, live Salesforce, calling OpenAI, re-ranking, regenerating briefs, notes on non-reserved NPIs, sentiment/next-action enums, search/filter on browse pages, expanding the assay catalog or territory.
- **Assumptions**: Market-intelligence “entries” that need a new page are events; providers reuse `/providers/$npi`. CRM “more data” means visit history plus `channel`, not more reserved NPIs. Follow-up notes keep Quinn Chen’s TAT concern and the other seven stories intact so ranked signals can stay frozen.
