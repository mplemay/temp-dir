# Tasks

## 1. Module layout

- [x] 1.1 Create `src/lib/crm-notes/` and `src/data/crm-notes/` and verify those directories exist

## 2. Schemas

- [x] 2.1 Implement Zod objects in `src/lib/crm-notes/schema.ts` for note rows (`npi` `/^\d{10}$/`, `note_date` `YYYY-MM-DD`, trimmed non-empty `body`) plus skip-report types, without importing market-intelligence schemas, and verify exported types compile under `vp check`
- [x] 2.2 Add schema unit tests that accept a valid note row, reject invalid NPI, reject empty body, and reject a non-`YYYY-MM-DD` `note_date`, and verify those tests pass with `vp test`

## 3. Loader and NPI lookup

- [x] 3.1 Implement `load.ts` to read `notes.csv` via an `fs` path resolved from `import.meta.url` (overridable for tests), parse with `csv-parse`, validate with Zod, skip invalid rows with `{ source, line, reason }`, accept multiple notes that share an NPI, ignore extra columns including TAT/volume/rank, and throw if the file is missing — then verify that implementation is exported
- [x] 3.2 Implement `notesForNpi`, `reservedNpisWithoutNotes`, and `notesOutsideReservedSet` in the same module, and verify unit tests pass with `vp test` for: `1600000004` returning only that NPI's notes, `1699999999` returning none, two notes sharing an NPI both returned, a reserved NPI with no notes reported as uncovered, and a note NPI not in the reserved set reported as extra
- [x] 3.3 Add loader tests that: load inline valid CSV; skip bad NPI / empty body / invalid date while keeping valid rows; accept two valid rows that share an NPI; ignore extra TAT or rank columns; throw when the fixture path is missing — and verify they pass with `vp test`

## 4. Committed notes fixture

- [x] 4.1 Write `src/data/crm-notes/notes.csv` with eight rows, one per reserved NPI `1600000001`–`1600000008`, columns `npi,note_date,body`, bodies matching the concern/interest table in design.md (Quinn Chen / `1600000004` names turnaround time in words), no patient identifiers, and no numeric TAT/gene-count/accuracy claims, then verify a load of the committed file accepts all eight with no skips
- [x] 4.2 Add fixture tests that load the committed file plus `loadMarketIntelligence()`, assert every reserved NPI has a note and every note NPI is reserved, headers contain no turnaround/gene-count/accuracy/volume/rank columns, bodies contain no `MRN`/`DOB`/named-patient markers and no numeric assay claims, and `vp test` passes those cases

## 5. Integration

- [x] 5.1 Run `vp test` and verify the full crm-notes suite and existing market-intelligence and product-knowledge tests pass
- [x] 5.2 Run `vp check` and verify format, lint, and type-check pass
- [x] 5.3 Confirm `src/routes/index.tsx` is unchanged (still the placeholder home card) so this change added no user-facing route
