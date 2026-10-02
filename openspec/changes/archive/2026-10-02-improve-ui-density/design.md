# Design

## Context

See `proposal.md` for motivation and the `app-shell` / `design-system` deltas for behavior.

Home (`src/routes/index.tsx`) maps 52 ranked rows through a static shadcn `Table`. `TableCell` is `whitespace-nowrap`; `why_now` is prose. `getRankedProviders` omits `readiness`. Brief (`src/routes/providers/$npi.tsx`) is three stacked `Card`s. `loadProviderBrief` already joins `readiness`, `concern`, and `interest`; `getProviderBrief` drops them and omits `impact_score`. Product Knowledge and CRM are card stacks; Market Intelligence wraps events in one card. `Input` exists; there is no `@tanstack/react-table`. Route modules MUST NOT import Node `fs` loaders. Home and brief HTML MUST still include names (and the brief script) without client JavaScript. Market Intelligence MUST NOT link to `/providers/$npi`.

## Goals / Non-Goals

**Goals:**

- One shared data-table composition for the ranked home list (TanStack Table + existing Table/Badge/Input).
- Two-column brief: talk track left, snapshot right, notes as a table; ranked signals passed through the existing join.
- Browse pages as dense tables; events out of the wrapping card.

**Non-Goals:**

- Changing ranks, mix formula, brief copy, or feed schemas.
- Calling OpenAI from runtime.
- Linking Market Intelligence rows to briefs.
- Column visibility, pagination, row selection, or saved filter state.
- Putting TanStack Table on CRM, Product Knowledge, events, or brief nested lists (too few rows).

## Decisions

### 1. TanStack Table only on the ranked home list; SSR the same rows

Add `@tanstack/react-table`. Put a `RankedProvidersTable` under `src/components/` that takes the loader rows as props, uses `useReactTable` with `getSortedRowModel` / `getFilteredRowModel` / `getCoreRowModel`, and renders through shadcn `Table` + `flexRender`.

Initial state: sort `{ id: "rank", desc: false }`, empty search, no column filters. That state is valid on the server, so the first HTML still contains rank-ordered names. Filtering is client-only after hydrate; it MUST NOT replace the table with an empty client shell.

Search: one `Input` matching `full_name` and `org_name`. Filters: three `Select`s (tumor focus, incumbent, readiness) whose options are unique values from the current payload. Add shadcn `Select` (and `Label` if the Select recipe needs it). Facet from data; do not hard-code catalogs.

Name cell stays a `Link` to `/providers/$npi`. Why-now: `whitespace-normal` and a max width so it wraps instead of forcing horizontal scroll. Identity columns stay nowrap. Readiness and incumbent: `Badge`.

**Why:** 52 rows make sort/filter/search worth a headless table. SSR-matching initial state is the only way to keep the existing “names in the first HTML” contract.

**Alternatives:**

- Plain shadcn `Table` with no interactivity. Fails the new search/sort/filter requirement.
- Client-only table mounted after hydrate. Fails the no-JS name requirement.
- TanStack Table on every browse page. Six assays and eight notes do not need it.

### 2. Pass ranked signals through; add `impact_score` to the brief view

Extend `getRankedProviders` with `readiness`.

Extend `ProviderBriefView` / `joinBrief` with `impact_score` from the ranked row (already on `RankedProviderView`). Pass `readiness`, `concern`, `interest`, `impact_score`, and assay `tat_days` / `gene_count` through `getProviderBrief`. Leave unpublished assay numbers null and blank in the UI.

Empty `concern` / `interest`: omit those snapshot rows. Empty `objection_response`: keep the existing “no known concern” copy in the talk-track column. Empty events or assays: omit those tables.

**Why:** The join already has the signals. The gap is the server-fn mapping, plus `impact_score` never copied onto the brief view.

**Alternatives:**

- Re-derive signals in the route. Forbidden: overview MUST come from committed feeds + ranked artifact, not a request-time model.
- Show concern/interest on home. Too much prose for a worklist; readiness is the scan signal.

### 3. Brief layout is CSS grid, not cards

```
header (name, org, specialty, location, rank, badges)
+---------------------------+---------------------------+
| Talk track                | Snapshot                  |
| Meeting script            | Why now                   |
| Objection or empty line   | Rank, score, patients     |
|                           | Interest / concern        |
|                           | Events table (if any)     |
|                           | Assays table (if any)     |
+---------------------------+---------------------------+
CRM notes table (if any)
```

`lg:grid-cols-2` with talk track first so mobile stacks script above facts. Use headings, `Separator`, `Badge`, and `Table`. Do not wrap the three regions in `Card`. `Card` may remain in the repo for unused leftovers; routes stop importing it as page chrome.

**Why:** The job is a doorstep sheet. Cards made one column of boxes and pushed the script down.

**Alternatives:**

- Tabs (Overview / Script / Objection). Hides the talk track.
- Keep cards in a two-column grid. Still boxed-off; spec forbids stacked cards as primary composition.

### 4. Browse pages become plain tables

Market Intelligence: two `Table`s (providers, events). Provider cells stay text, not `Link`.

Product Knowledge: `Table` of display name, specimen badge, regulatory-status badge, TAT, gene count. Null TAT/gene: muted “unpublished” or blank, never a fabricated number.

CRM: `Table` of date, clinician name (or NPI), body with wrapping.

**Why:** Same density language as home without dragging TanStack Table into tiny lists.

**Alternatives:**

- Data table on all browse pages. Extra dependency surface for no user need.

## Risks / Trade-offs

- **[Risk] Hydration mismatch if table state is seeded from `window` or localStorage** → Mitigation: default sort/filter/search are constants; no browser storage.
- **[Risk] `whitespace-nowrap` on `TableCell` keeps why-now overflowing** → Mitigation: override wrap on prose cells only.
- **[Risk] `Select` / TanStack Table import `openai` or Node loaders into the client** → Mitigation: table components receive props; they do not call `getRankedProviders` themselves. Server fns stay in `src/lib/browse/server.ts`.
- **[Trade-off] Client filter hides rows after hydrate** → Initial HTML still has all names, which is what the spec requires.
- **[Trade-off] Card primitive becomes unused on these routes** → Leave the component in place; do not delete it in this change.

## Migration Plan

Install `@tanstack/react-table`, add shadcn `Select`, extend the two server mappings, then restyle the five routes. Rollback is reverting the change. No data migration; artifacts stay as committed.

## Open Questions

None. Home-only TanStack Table, brief CSS grid, and ranked-signal pass-through are recorded above.
