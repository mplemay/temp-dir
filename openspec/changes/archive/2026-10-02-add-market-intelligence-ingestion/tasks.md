# Tasks

## 1. Dependencies and module layout

- [x] 1.1 Add `zod` and `csv-parse` with `vp add` (or the Vite+ equivalent) and verify they appear in `package.json` and install cleanly
- [x] 1.2 Create `src/lib/market-intelligence/` and `src/data/market-intelligence/` and verify those directories exist

## 2. Schemas

- [x] 2.1 Implement Zod enums and objects in `src/lib/market-intelligence/schema.ts` for provider rows (NPI `/^\d{10}$/`, org type, specialty, tumor focus including `mixed`, incumbent lab, volume confidence, `reserved_for_crm`) and event rows (tumor type without `mixed`) and verify exported types compile under `vp check`
- [x] 2.2 Add schema unit tests that accept a valid provider and event fixture row, reject invalid NPI, specialty, incumbent, `volume_confidence`, and `est_ngs_testing_rate` outside 0–1, and verify those tests pass with `vp test`

## 3. Opportunity derivation

- [x] 3.1 Implement `derive.ts` with the clamp/round formula from design.md (`40` orders / `200` eligible → share `0.2` and `160` opportunity; zero eligible → `0`/`0`) and verify unit tests for those two cases pass with `vp test`

## 4. Loader

- [x] 4.1 Implement `load.ts` to read `providers.csv` and `events.csv` via `fs` paths resolved from `import.meta.url`, parse with `csv-parse`, validate with Zod, skip invalid rows with `{ source, line, reason }`, treat duplicate NPI as skip-after-first, ignore extra columns including `rank`/`impact_score`, attach derived fields and `matched_events`, and throw if either file is missing
- [x] 4.2 Add loader tests that: load inline valid CSVs; skip bad specialty/rate while keeping valid rows; skip duplicate NPI; match NSCLC events only for NSCLC providers and all events for `mixed`; ignore a `rank` column when computing share; throw when a fixture path is missing — and verify they pass with `vp test`

## 5. Committed territory fixtures

- [x] 5.1 Write `src/data/market-intelligence/events.csv` with several tumor-typed why-now rows (at least NSCLC and CRC, plus others as needed) using columns `event_id,tumor_type,event_date,headline,relevant_tests,why_now` and no assay performance numbers, then verify a load of that file accepts every event row
- [x] 5.2 Write `src/data/market-intelligence/providers.csv` with 40–80 synthetic clinicians in a Chicago-style mix (academic or NCI plus community hospital or independent practice), `est_*` volumes with `volume_basis=practice_type_model`, at least eight unique `reserved_for_crm=true` NPIs, and no TAT/gene-count/accuracy columns
- [x] 5.3 Add fixture tests that load the committed files and verify accepted provider count is 40–80, both academic-or-NCI and community-or-independent types are present, at least eight unique CRM-reserved NPIs exist, headers contain no turnaround/gene-count/accuracy columns, and `vp test` passes those cases

## 6. Integration

- [x] 6.1 Run `vp test` and verify the full market-intelligence suite passes
- [x] 6.2 Run `vp check` and verify format, lint, and type-check pass
- [x] 6.3 Confirm `src/routes/index.tsx` is unchanged (still the placeholder home card) so this change added no user-facing route
