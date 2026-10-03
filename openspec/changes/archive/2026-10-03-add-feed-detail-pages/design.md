# Design

## Context

See `proposal.md` for motivation and the `app-shell`, `design-system`, and `crm-notes` deltas for behavior.

Browse routes are flat files (`src/routes/product-knowledge.tsx`, `market-intelligence.tsx`, `crm.tsx`) with list-only tables. `src/lib/browse/display.test.ts` currently asserts Market Intelligence has no `/providers/$npi` links. The only dynamic route is `src/routes/providers/$npi.tsx`; every accepted market-intelligence provider is already ranked, so that brief exists for each MI clinician.

CRM ingest is three columns (`npi`, `note_date`, `body`) and eight rows. `parseCrmNotes` ignores extra columns and does not unique on NPI. `notesForNpi` already returns every match. Product knowledge already uniques on `test_id` and exposes `eventTokens` / `resolveAssays`. Briefs join CRM notes and related assays at read time; `BriefAssayPayload` currently omits `test_id`, so the brief cannot link to an assay page. Sidebar `isActive` is exact pathname match, so nested detail URLs would unmark the feed item.

Route modules MUST NOT import Node `fs` loaders. Unknown ids use TanStack `notFound()`. Do not call OpenAI. Do not rewrite ranked-providers or briefs artifacts.

## Goals / Non-Goals

**Goals:**

- Nested file routes so each feed list has child detail pages, matching `providers/$npi`.
- Server functions return one joined payload per id, or null for `notFound()`.
- CRM schema + fixture carry stable `note_id`, `channel`, and visit history without regenerating ranks or briefs.
- Browse and brief tables become the same `Link` pattern as the home name cell.

**Non-Goals:**

- A second market-intelligence provider page (raw volume card).
- A markdown renderer, new shadcn primitives, or TanStack Table on these small lists.
- Linking brief CRM notes to note pages (assays only; notes already appear on the brief after the fixture expand).
- Changing `reservedNpisWithoutNotes` from “zero notes” to “fewer than two” in place; add a min-count helper instead.

## Decisions

### 1. Nested index + `$id` routes; param names match `$npi`

Replace the three flat route modules with:

```
src/routes/product-knowledge/index.tsx
src/routes/product-knowledge/$testId.tsx
src/routes/market-intelligence/index.tsx
src/routes/market-intelligence/$eventId.tsx
src/routes/crm/index.tsx
src/routes/crm/$noteId.tsx
```

Loaders: 10-digit NPI is already validated in `getProviderBrief`. For the new pages, reject empty params and unknown ids with `notFound()`. `note_id` MUST match `^[a-z0-9]+(?:-[a-z0-9]+)*$` in the Zod schema so the path segment needs no encoding.

Sidebar: Home stays exact `pathname === "/"`. The three feeds are active when `pathname === to || pathname.startsWith(to + "/")`.

**Why:** Child routes are the reason the original browse design avoided folders. `$testId` / `$eventId` / `$noteId` follow the existing `$npi` camelCase param. Prefix `isActive` is the only way the spec’s “current page is marked” still holds on a detail URL.

**Alternatives:**

- Query strings (`/product-knowledge?id=xt`). Weaker shareable URLs; not real pages.
- `/assays/$testId` siblings at the root. Splits the feed from its list; sidebar active-state gets worse.
- A raw `/market-intelligence/providers/$npi` page. Duplicates the brief for every ranked clinician.

### 2. Join at the server function; keep ingest modules free of UI

Add `getAssay`, `getMarketEvent`, and `getCrmNote` next to the existing browse server functions. Each takes an id, loads the hosted snapshot, and returns a view payload or `null`.

| Page  | Payload essentials                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| Assay | Accepted assay fields as stored (body, aliases, provenance, nullable TAT/gene)                              |
| Event | Event fields plus `assays: { test_id, display_name }[]` from `eventTokens` + `resolveAssays` (dedupe by id) |
| Note  | Note fields plus `clinician_name` and `siblings` (other notes for that NPI, newest date first)              |

Add `noteForId(noteId, notes)` in `crm-notes/load.ts` (undefined when missing). Assay and event lookup stay `Array.find` in the server fn; those catalogs are six rows.

Extend `BriefAssayPayload` with `test_id`. `joinBrief` already has the full assay; pass `test_id` through `toBriefPagePayload`. Brief related-assay cells become `Link`s to `/product-knowledge/$testId`.

List payloads already include `test_id`, `event_id`, and (after schema change) `note_id`. Wrap the identifying cell in `Link`, same underline treatment as the home name column.

**Why:** Same SSR boundary as briefs. Joining relevant tests in the server fn reuses the coverage helpers the ingest already owns. Putting `test_id` on the brief payload is a display join, not a briefs-artifact change.

**Alternatives:**

- Import `loadProductKnowledge` from the route. Bundles `fs` into the client.
- Resolve assay links only by display name. Fragile; `test_id` is the route key.
- Show every matching provider on an event page. Dozens of NSCLC rows; not asked.

### 3. CRM schema: unique `note_id`, channel enum, duplicate skip after parse

Zod object:

```
note_id   /^[a-z0-9]+(?:-[a-z0-9]+)*$/
npi       /^\d{10}$/
note_date YYYY-MM-DD
channel   call | in_person | email
body      trimmed non-empty
```

After a successful parse, skip duplicate `note_id` with reason `note_id: duplicate` (same pattern as assay `test_id`). Extra CSV columns remain ignored.

Helpers: keep `notesForNpi` and `reservedNpisWithoutNotes` (zero notes). Add `noteForId` and `reservedNpisBelowMinNotes(reserved, notes, 2)` for the committed-fixture coverage test.

**Why:** `note_id` is the only stable URL key once two notes share an NPI and date. Channel is the one extra column a note page can show without becoming a Salesforce model. Duplicate skip lives in the parser so invalid fixture rows never become two URLs.

**Alternatives:**

- Composite URL `npi+date`. Collides on same-day follow-ups; ugly paths.
- UUID `note_id`. Works, but unreadable in a demo.
- Sentiment / next-action columns. Previously rejected; still unused by ranking.

### 4. Fixture authorship: keep the eight stories, add two follow-ups each

Do not add reserved NPIs. Keep the original eight bodies as the earliest visit for that clinician (same concern/interest cues). Add two later-dated notes per NPI (24 rows total) that continue the same thread: operational follow-up, a scheduled next step, or a restated interest — never a new switch/retain signal that would make frozen ranked `concern` look wrong.

Canonical slugs (first visit keeps the cue in the id):

| npi        | first `note_id`                 |
| ---------- | ------------------------------- |
| 1600000001 | `avery-chen-liquid-progression` |
| 1600000002 | `jordan-chen-her2-low`          |
| 1600000003 | `riley-chen-hrd`                |
| 1600000004 | `quinn-chen-tat`                |
| 1600000005 | `morgan-chen-in-house`          |
| 1600000006 | `casey-chen-heme-path`          |
| 1600000007 | `harper-chen-ops`               |
| 1600000008 | `drew-chen-community-hrd`       |

Mix channels: first visit `in_person`, then `call`, then `email`. Dates stay mock and chronological. Quinn’s TAT-vs-Guardant sentence remains in `quinn-chen-tat`. No PHI markers, no numeric TAT/gene/accuracy claims.

Update `fixtures.test.ts`: accepted count 24, at least two notes per reserved NPI, unique `note_id`s, Quinn’s TAT body still present. Schema tests cover missing id, duplicate id, and invalid channel. `display.test.ts` must expect `/providers/$npi` on the MI index and must point at the nested `index.tsx` paths.

**Why:** Ranking extracted readiness from the original eight bodies. Follow-ups join onto brief and CRM pages at read time, so the demo gets a thread without `OPENAI_API_KEY` during apply.

**Alternatives:**

- Re-run `rank-providers` and `generate-briefs`. Correct if concerns change; out of scope because they must not.
- One extra note per NPI (16 rows). Meets “at least two” but a thread of three is what makes the note page’s sibling table look real.

### 5. Page composition stays tables, badges, and prose — no cards, no markdown engine

Assay page: heading + badges (specimen, regulatory status) + definition list for aliases, TAT/gene via `unpublishedMetric`, source URL (plain `<a href>`), retrieved-on, then body in `whitespace-pre-wrap`. Bodies are already paragraph prose after front matter.

Event page: heading, tumor badge, date, why-now paragraph, relevant-tests `Table` with assay `Link`s.

Note page: heading (clinician name or NPI), date, channel `Badge`, body, sibling `Table` of other notes (link on date). Do not include the current note in siblings.

No `Card` imports on these routes (same density rule as browse/brief). Commit regenerated `routeTree.gen.ts`.

**Why:** Six assays and ~24 notes do not need a data table library. A markdown dependency would only wrap paragraphs we already store as text.

**Alternatives:**

- `react-markdown`. Extra runtime for no headings/lists in the committed bodies.
- Stacked `Card`s. Forbidden by the design-system delta.

## Risks / Trade-offs

- **[Risk] Sidebar goes inactive on detail URLs** → Prefix match for the three feed paths; keep Home exact so `/` does not match everything.
- **[Risk] Follow-up notes contradict frozen ranked concern/interest** → Authorship table: same eight cues; Quinn TAT sentence stays; fixture test still asserts that body.
- **[Risk] Duplicate `note_id` in a hand-edited CSV** → Parser skip with `note_id: duplicate`; fixture test asserts unique ids.
- **[Risk] `xF/xF+` token maps to two assays** → Deduplicate by `test_id`; show both links.
- **[Trade-off] Ranked signals ignore the new notes** → Accepted. Regeneration needs the generate-time API key and would rewrite the worklist. Notes still appear on briefs via `notesForNpi`.
- **[Trade-off] MI providers skip the hidden volume fields** → Those fields remain inspectable only in `providers.csv`. The brief is the per-clinician page the app already has.

## Migration Plan

1. Extend CRM schema, parser, helpers, and tests; rewrite `notes.csv`.
2. Add payloads and server functions; pass `test_id` through the brief join.
3. Move browse files into nested routes; add the three `$id` pages; fix sidebar active state; invert the MI-link assertion.
4. `vp check` / `vp test`; browse lists, one happy-path detail each, and an unknown id in the browser.

Rollback: revert the change. No production data. Ranked and briefs artifacts stay put.

## Open Questions

None. Nested routes, MI providers → existing briefs, CRM history without re-rank, and no markdown engine are recorded above.
