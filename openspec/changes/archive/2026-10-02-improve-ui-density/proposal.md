# Proposal

## Why

The copilot UI wastes space and hides the work. Ranked and browse pages are static markup or stacked cards; person briefs put the meeting script and objection below a full-width overview card. Ranked signals already in the artifact (`readiness`, `concern`, `interest`, `impact_score`) never reach the screen. A density pass makes the worklist scannable and the brief usable as a doorstep sheet.

## What Changes

- Rebuild the ranked home list as an interactive data table (sort, filter, search) that still SSR-renders names in rank order before JavaScript.
- Show ranked `readiness` on home; keep existing identity, volume, incumbent, and why-now columns.
- Rebuild each provider brief as a two-column copilot layout: talk track (script + objection) beside a fact snapshot (why-now, rank signals, events, assays), with CRM notes as a compact table—not a stack of cards.
- Surface `readiness`, `concern`, `interest`, and `impact_score` on the brief from the ranked join; do not generate them at request time.
- Present Product Knowledge assays, CRM notes, and market events as dense tables instead of cards.
- Keep Market Intelligence rows unlinked and unranked.

## Capabilities

### New Capabilities

- None. This is a presentation change to existing pages.

### Modified Capabilities

- `app-shell`: Home list is sortable/filterable while remaining SSR-visible in rank order and includes readiness. Brief page shows talk-track plus snapshot, including ranked signals. Browse pages still list the same feed fields, as tables.
- `design-system`: Worklists compose a shared data-table primitive. Browse pages and brief nested lists use table and badge primitives instead of cards as the primary layout. Brief page is a two-column copilot composition, not stacked cards.

## Impact

- Routes: `src/routes/index.tsx`, `src/routes/providers/$npi.tsx`, `src/routes/market-intelligence.tsx`, `src/routes/product-knowledge.tsx`, `src/routes/crm.tsx`.
- Server join: `src/lib/browse/server.ts` must pass ranked signals onto home and brief payloads. Feed loaders, ranking, and brief generation stay unchanged.
- Dependencies: add TanStack Table and the shadcn data-table pieces it needs (`@tanstack/react-table`, likely Input). Existing shadcn `Table` / `Badge` remain the visual primitives.
- Specs: `design-system` currently requires cards on the brief, Product Knowledge, and CRM; those requirements are replaced.
- Tests: no route tests today. Cover SSR name presence, brief field visibility, and that Market Intelligence still does not link to `/providers/$npi`. Pipeline tests stay as-is.
