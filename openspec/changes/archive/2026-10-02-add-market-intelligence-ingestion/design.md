# Design

## Context

See `proposal.md` for motivation. Specs are in `specs/market-intelligence/spec.md`.

The app is a TanStack Start + Vite+ SSR shell (`src/routes/index.tsx` is still the placeholder home card). There is no `src/lib` domain module, no CSV fixtures, no Zod, and no tests yet. `vp test` is available from Vite+. Routes and shadcn primitives must stay unchanged.

Constraints:

- Ingest is a server-side contract for later copilot features; this change does not add a page.
- Volume and share-of-wallet fields are mock estimates. Do not call CMS, NPPES, or Salesforce.
- Product performance numbers (TAT, gene counts, CDx accuracy) belong in a future knowledge-base change, not these CSVs.

## Goals / Non-Goals

**Goals:**

- One loader returns accepted providers, accepted events, and a skip report from committed CSVs.
- Schema and allow-lists live in one place so a later ranking module can import records without re-parsing.
- Opportunity features are derived in code with a documented formula.

**Non-Goals:**

- A ranked list, UI, upload endpoint, or CRM/product-KB ingest.
- Check-digit (Luhn) NPI validation or live registry lookup.
- Treating estimates as clinical or Tempus-internal truth.

## Decisions

### 1. Colocate fixtures under `src/data/market-intelligence/`

Commit `providers.csv` and `events.csv` next to a short `README` is **not** required. Paths:

```
src/data/market-intelligence/providers.csv
src/data/market-intelligence/events.csv
src/lib/market-intelligence/schema.ts
src/lib/market-intelligence/load.ts
src/lib/market-intelligence/derive.ts
```

Loader reads the files with `fs` from paths resolved off `import.meta.url` so tests and SSR share the same code and do not depend on process cwd.

**Why:** These files are source fixtures, not static assets. Putting them in `public/` would publish fake commercial overlay on the web. A repo-root `data/` folder is fine but one more path for Vite/Start to miss; `src/data` stays on the existing `@/` alias.

**Alternatives:**

- `?raw` CSV imports. Idiomatic in Vite, but couples tests to the bundler transform and makes skip-report line numbers harder.
- Single denormalized CSV with event columns repeated per row. Simpler file count; explodes when two events share a tumor type.

### 2. Zod object schemas plus `csv-parse`

Validate rows with Zod after a real CSV parse (`csv-parse` sync). Do not hand-split on commas.

Provider allow-lists (closed enums in Zod):

- `org_type`: `academic` | `nci_designated` | `community_hospital` | `independent_practice`
- `incumbent_lab`: `Tempus` | `FMI` | `Caris` | `Guardant` | `in_house` | `unknown`
- `volume_confidence`: `high` | `medium` | `low`
- `primary_tumor_focus`: `NSCLC` | `breast` | `CRC` | `prostate` | `gyn` | `heme` | `mixed`
- `specialty`: `Medical Oncology` | `Hematology/Oncology` | `Gynecologic Oncology` | `Thoracic Oncology` | `Surgical Oncology`
- `npi`: `/^\d{10}$/`
- `reserved_for_crm`: boolean (`true`/`false` in CSV)

Event `tumor_type` uses the same tumor-focus enum except `mixed` (events are specific; mixed is a provider attribute).

**Why:** Specs need skip reasons per field. Zod issues map cleanly to the report. `csv-parse` handles quoted org names.

**Alternatives:**

- Valibot. Fine, but Zod is the usual partner with this stack and we have no existing validator.
- JSON fixtures. Violates the case-study CSV source; worse for a sales-ops “drop a file” story.

### 3. Fail the load on missing files; skip bad rows

Missing either CSV is a thrown load error (fail closed). Duplicate NPI: first valid row wins, later duplicates skip. Extra CSV columns are ignored (including `rank` / `impact_score`). Per-row failures never abort the rest of the file.

Load result shape:

```
{
  providers: AcceptedProvider[]   // includes derived fields + matched_events
  events: AcceptedEvent[]
  report: { acceptedProviders, acceptedEvents, skipped: { source, line, reason }[] }
}
```

**Why:** A territory with a few dirty rows should still boot. A missing fixture is a deploy bug, not an empty metro.

### 4. Opportunity formula (deterministic)

For each accepted provider:

```
if est_advanced_solid_tumor_annual <= 0:
  tempus_share = 0
  opportunity_patients = 0
else:
  tempus_share = clamp(tempus_orders_t12m / est_advanced_solid_tumor_annual, 0, 1)
  opportunity_patients = round(est_advanced_solid_tumor_annual * (1 - tempus_share))
```

`tempus_share` is a 0–1 fraction of estimated advanced-solid-tumor volume already sent to Tempus, not a dollar share of wallet. `est_ngs_testing_rate` is stored for a later ranking change; it does not enter this formula.

Matched events: `event.tumor_type === provider.primary_tumor_focus`, or all events when focus is `mixed`. Attach `matched_events` on the provider record at load time.

### 5. Fixture content: synthetic NPIs, public org types, Chicago mix

- 40–80 rows. At least eight `reserved_for_crm=true` with unique NPIs (join keys for a future notes file).
- Clinician names and NPIs are synthetic. Organization names may be real public Chicago-area systems (academic + community) so the territory feels like a Tempus metro, without tying a real physician to mock volumes or incumbents.
- Volumes follow practice-type bands (community hem/onc ~200–400 new patients/year; academic specialists lower census, higher NGS rate). Every volume column stays `est_*` with `volume_basis` of `practice_type_model`.
- Events are a handful of tumor-typed “why now” hooks (for example CRC xT CDx claims, NSCLC liquid for resistance/QNS). No assay performance numbers.

**Alternatives:**

- Real NPPES rows plus mock overlay. More accurate identity; higher risk of looking like a claim about a named doctor. Rejected for the prototype.
- 8–10 rows matching future CRM notes. Rejected: ranking later would only order the people we wrote notes for.

### 6. Tests, not a route, prove the contract

Vitest (`vp test`) covers parse, skip report, duplicate NPI, derived 40/200 → 0.2 share and 160 opportunity, mixed vs NSCLC event matching, fixture size 40–80, at least eight CRM-reserved NPIs, and absence of TAT/gene-count/accuracy columns. No new route; `app-shell` stays as-is.

## Risks / Trade-offs

- **[Risk] Real hospital names + mock volumes are misread as Tempus data** → Mitigation: synthetic clinician identity; `est_*` column names; `volume_basis=practice_type_model` on every row.
- **[Risk] Share formula treats orders as patients** → Mitigation: document it as a ranking feature, not a clinical rate; do not put the number in a user-facing UI in this change.
- **[Risk] csv-parse / Zod add dependencies to a tiny app** → Mitigation: they are the cheapest way to meet skip-report and quoted-field requirements; no UI or network deps.
- **[Trade-off] No Luhn NPI check** → Format-only identity is enough to join CRM later; Luhn would imply registry-grade IDs we are not pulling.

## Migration Plan

Add fixtures, loader, schemas, and tests. No production data and no schema to migrate. Rollback is reverting the change. Later CRM-notes ingest MUST key off `reserved_for_crm` NPIs rather than inventing new ones.

## Open Questions

None. Metro (Chicago-style), 40–80 row scale, and synthetic commercial overlay are recorded as assumptions in the proposal.
