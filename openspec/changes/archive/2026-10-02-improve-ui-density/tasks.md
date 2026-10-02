# Tasks

## 1. Dependencies

- [x] 1.1 Add `@tanstack/react-table` and the shadcn `Select` primitive (plus `Label` if the Select recipe requires it), and verify the packages and `src/components/ui/select.tsx` exist and `vp check` still passes

## 2. Ranked signals in page payloads

- [x] 2.1 Add `impact_score` to `ProviderBriefView` and `joinBrief` from the ranked row, and verify provider-briefs load tests pass with `vp test` and a loaded brief’s `impact_score` matches its ranked row
- [x] 2.2 Pass `readiness` from `getRankedProviders`, and pass `readiness`, `concern`, `interest`, `impact_score`, and assay `tat_days` / `gene_count` from `getProviderBrief`, then add mapping tests that a list row includes `readiness` and a brief payload includes those ranked signals with unpublished assay numbers left null, and verify they pass with `vp test` and no `openai` import

## 3. Ranked home data table

- [x] 3.1 Add `RankedProvidersTable` that takes loader rows as props, uses TanStack Table (`getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`) with default rank-ascending sort, a name/org `Input` search, `Select` filters for tumor focus, incumbent, and readiness faceted from the payload, wrapping why-now, readiness and incumbent `Badge`s, and a name `Link` to `/providers/$npi`, then verify the component does not import Node `fs` loaders or `openai` and `vp check` passes
- [x] 3.2 Extract search/filter matching into a testable helper, cover name search and incumbent filter with unit tests, and verify those tests pass with `vp test`
- [x] 3.3 Replace the static home table in `src/routes/index.tsx` with `RankedProvidersTable`, keep the existing loader, and verify the route imports table, badge, and input primitives from `@/components/ui` (not inline markup) and still has no Market Intelligence, Product Knowledge, or CRM card titles

## 4. Provider brief layout

- [x] 4.1 Rebuild `src/routes/providers/$npi.tsx` as a header plus `lg:grid-cols-2` talk-track (script, objection or no-known-concern line) beside snapshot (why-now, rank, impact score, patients, non-empty concern/interest, events table, assays table with blank unpublished TAT/gene) and a CRM notes table when notes exist, using `Table`, `Badge`, and `Separator` with no `Card` page chrome, then verify the route imports those primitives from `@/` and does not import `Card`
- [x] 4.2 Confirm empty `objection_response` still shows the no-known-concern copy without drafted-objection text, and verify Quinn Chen (`1600000004`) still receives a non-empty `objection_response` from the existing loader

## 5. Browse page tables

- [x] 5.1 Replace the Market Intelligence events card with a shared `Table` of headline and tumor type, keep providers as a shared `Table` with incumbent `Badge`s and no per-provider `Link`, and verify the route has no `Card` import and no `/providers/$npi` link
- [x] 5.2 Replace Product Knowledge assay cards with a shared `Table` of display name, specimen badge, regulatory-status badge, TAT, and gene count, and verify a null TAT does not render as a number
- [x] 5.3 Replace CRM note cards with a shared `Table` of date, clinician name (or NPI), and wrapping body, and verify notes still show the matching clinician name when the NPI is in market intelligence

## 6. Integration

- [x] 6.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 6.2 Run `vp test` and verify new browse/table tests plus existing ingest, ranking, briefs, and browse tests pass
- [x] 6.3 Run `vp build` and verify the production build succeeds without `OPENAI_API_KEY`
- [x] 6.4 Run `vp dev` and in the browser verify: `/` shows rank-ordered names in the first paint with search/sort/filter controls and a readiness column; filtering incumbent narrows rows; a name opens that brief; the brief is two-column (script beside why-now/signals, not stacked cards) with tables for notes/events/assays when present; Quinn Chen shows the TAT objection; a no-CRM provider shows no drafted objection; Market Intelligence, Product Knowledge, and CRM are tables without cards; Market Intelligence names are not links
