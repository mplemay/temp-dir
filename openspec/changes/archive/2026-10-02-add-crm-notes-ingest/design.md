# Design

## Context

See `proposal.md` for motivation. Specs are in `specs/crm-notes/spec.md`.

Market intelligence lives at `src/lib/market-intelligence/` with eight `reserved_for_crm=true` NPIs (`1600000001`–`1600000008`) in `src/data/market-intelligence/providers.csv`. Product knowledge lives at `src/lib/product-knowledge/` and owns TAT, gene counts, and CDx claims. Zod and `csv-parse` are already in the app. `src/routes/index.tsx` is still the placeholder home card.

Constraints:

- Ingest is a server-side contract for later copilot features; this change does not add a page.
- Notes are mock sales-interaction prose. Do not call Salesforce. Do not attach notes onto `AcceptedProvider`.
- Assay numbers and volume/rank fields stay out of this feed.

## Goals / Non-Goals

**Goals:**

- One loader returns accepted notes and a skip report from a committed CSV.
- `notesForNpi` returns every accepted note for a given NPI, including an empty list.
- Committed-fixture tests prove every reserved NPI has a note and no note invents an NPI.

**Non-Goals:**

- Generating objection copy or meeting scripts.
- A concern-type enum, sentiment, next action, or Salesforce object model.
- Mutating market-intelligence records or attaching `notes` onto providers.
- Treating clinician names in the body as PHI; those identities already exist on the provider fixture.

## Decisions

### 1. Colocate one CSV under `src/data/crm-notes/`

Paths:

```
src/data/crm-notes/notes.csv
src/lib/crm-notes/schema.ts
src/lib/crm-notes/load.ts
```

Loader reads the file with `fs` from a path resolved off `import.meta.url`, same as market intelligence. Missing file throws `MissingFixtureError`. Per-row failures skip.

**Why:** Case study source type is text; market intelligence already uses CSV for tabular clinician-keyed rows. Markdown-per-physician would copy the assay-card pattern without needing front-matter claims.

**Alternatives:**

- One markdown file per NPI. Worse for eight short notes; skip reports would be per file for no gain.
- JSON. Violates the “drop a file” CSV/text story used by the other territory feed.

### 2. Three-column Zod schema; allow duplicate NPIs

Validate with Zod after `csv-parse` sync. Columns: `npi` (`/^\d{10}$/`), `note_date` (`YYYY-MM-DD`), `body` (trimmed non-empty string). Extra columns are ignored, including any TAT, gene-count, accuracy, volume, or rank headers.

Do not unique on NPI. Duplicate NPIs with different bodies are both accepted. Duplicate the NPI regex locally; do not import `providerRowSchema`.

Load result shape:

```
{
  notes: AcceptedNote[]
  report: { acceptedNotes, skipped: { source, line, reason }[] }
}
```

`notesForNpi(npi, notes)` filters on exact NPI. Coverage helpers (`reservedNpisWithoutNotes`, `notesOutsideReservedSet`) take reserved NPI strings and notes; they are not called inside `loadCrmNotes`.

**Why:** Specs need skip reasons per field. Independent loaders match product knowledge: unit tests can parse a subset CSV without loading the territory. Coverage as a committed-fixture test matches event-token coverage.

**Alternatives:**

- Skip unknown / non-reserved NPIs inside the loader. Couples this module to market intelligence and breaks isolated schema tests.
- `concern_type` column. Makes later generation deterministic, but is a taxonomy the case study did not ask for; put the concern in the body.
- Attach notes onto `AcceptedProvider` at market-intelligence load time. Changes a spec we are not modifying.

### 3. Fixture content: one note per reserved NPI

Eight rows, one each for `1600000001`–`1600000008`. Dates are recent mock visit dates. Bodies are 1–3 sentences of sales-interaction prose: one named concern in words, one interest or relationship cue. Clinician names from the provider row are allowed. No patient names, `MRN`, or `DOB`. No numeric TAT, gene counts, or accuracy claims — say “concerned about turnaround time,” not “6-day TAT.”

Intended concerns (fixture authorship, not schema):

| npi        | clinician   | concern in prose              | interest cue                        |
| ---------- | ----------- | ----------------------------- | ----------------------------------- |
| 1600000001 | Avery Chen  | liquid at progression         | already orders Tempus tissue        |
| 1600000002 | Jordan Chen | switching from FMI            | HER2-low therapy decisions          |
| 1600000003 | Riley Chen  | HRD before later-line therapy | gyn academic trials                 |
| 1600000004 | Quinn Chen  | turnaround time               | Guardant liquid incumbent           |
| 1600000005 | Morgan Chen | send-out vs in-house          | surgical gyn specimen flow          |
| 1600000006 | Casey Chen  | heme panel path               | unclear incumbent                   |
| 1600000007 | Harper Chen | operational follow-through    | high existing Tempus volume         |
| 1600000008 | Drew Chen   | community access to HRD       | independent practice, FMI incumbent |

**Why:** Ranking later still has ~50 providers without notes. These eight exist so objection handling and scripts have relationship context on the reserved join keys. Quinn Chen is the case-study TAT example.

**Alternatives:**

- Multiple notes per physician. Schema allows it; a timeline is unused until generation exists.
- Notes for non-reserved NPIs. Rejected by the market-intelligence migration rule.

### 4. Tests, not a route, prove the contract

Vitest (`vp test`) covers schema, skip report, shared NPI accepted, `notesForNpi`, missing-file throw, committed coverage of reserved NPIs, absence of TAT/volume/rank columns, no assay-number claims in bodies, and no `MRN`/`DOB`/named-patient markers in bodies. No new route; `app-shell` stays as-is.

## Risks / Trade-offs

- **[Risk] Bodies quote public TAT and get read as product claims** → Mitigation: committed-fixture test forbids numeric TAT, gene-count, and accuracy claims; later generation MUST cite product knowledge.
- **[Risk] Clinician names in notes look like real Salesforce data** → Mitigation: same synthetic Chen identities already on the provider CSV; mock visit dates; no patient identifiers.
- **[Trade-off] Concern lives in prose, not an enum** → A later generator must read the body. Acceptable for eight obvious notes; adding a taxonomy now is unused schema.
- **[Trade-off] Loader does not enforce reserved NPIs** → Isolated tests stay simple; coverage is a committed-fixture invariant, same as assay/event-token coverage.

## Migration Plan

Add the CSV, loader, schema, and tests. No production data to migrate. Rollback is reverting the change. Later generation MUST call `notesForNpi` rather than pasting CRM prose into prompts by hand.

## Open Questions

None. Ingest-only CSV, three columns, one note per reserved NPI, and coverage-as-test are recorded in the proposal.
