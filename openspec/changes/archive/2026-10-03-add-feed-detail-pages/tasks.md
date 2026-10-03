# Tasks

## 1. CRM schema and lookup

- [x] 1.1 Extend `noteRowSchema` with unique-path `note_id` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and `channel` (`call` | `in_person` | `email`), update schema tests to accept a valid row and reject missing `note_id`, empty `note_id`, and an invalid channel, and verify those tests pass with `vp test`
- [x] 1.2 Skip duplicate `note_id` after a successful parse with reason `note_id: duplicate`, keep extra CSV columns ignored, update load tests (headers, shared NPI with distinct ids, mixed invalid rows), and verify they pass with `vp test`
- [x] 1.3 Add `noteForId` (exact id or no note) and `reservedNpisBelowMinNotes(reserved, notes, min)`, keep `reservedNpisWithoutNotes` as zero-note coverage, add tests for `quinn-chen-tat` vs `missing-note` and a reserved NPI with only one note, and verify they pass with `vp test`

## 2. CRM fixture history

- [x] 2.1 Rewrite `src/data/crm-notes/notes.csv` to 24 rows (three per reserved NPI) with `note_id,npi,note_date,channel,body`, keep the original eight concern/interest cues as the earliest visit (Quinn TAT body on `quinn-chen-tat`), add two later follow-ups per clinician using `in_person` then `call` then `email`, and verify the file has unique `note_id`s and no PHI or numeric assay-claim language
- [x] 2.2 Update committed-fixture tests to expect 24 accepted notes, at least two notes per reserved NPI via `reservedNpisBelowMinNotes(..., 2)`, unique `note_id`s, Quinn’s TAT body still present, forbidden TAT/volume/rank headers still absent, and verify they pass with `vp test`

## 3. Page payloads and server functions

- [x] 3.1 Add `test_id` to `BriefAssayPayload`, pass it through `joinBrief` and `toBriefPagePayload`, update payload tests, and verify `vp test` shows a brief assay includes `test_id` with unpublished TAT/gene still null
- [x] 3.2 Add view-model helpers (or payload mappers) for assay, event (deduped `eventTokens` + `resolveAssays`), and note (`clinician_name` plus siblings excluding the current `note_id`, newest date first), cover xF/xF+ mapping to both liquid assays and sibling filtering, and verify those tests pass with `vp test`
- [x] 3.3 Add `getAssay`, `getMarketEvent`, and `getCrmNote` server functions that return the joined payload or `null` for an unknown id, leave list loaders returning records that include `test_id` / `event_id` / `note_id`, and verify route modules will not need to import Node `fs` loaders or `openai`

## 4. Nested browse routes and detail pages

- [x] 4.1 Move the three browse modules to `src/routes/{product-knowledge,market-intelligence,crm}/index.tsx`, wrap assay names, event headlines, CRM rows, and MI provider names in `Link`s (`/product-knowledge/$testId`, `/market-intelligence/$eventId`, `/crm/$noteId`, `/providers/$npi`), invert `display.test.ts` so MI is expected to contain `/providers/$npi` and source paths point at the nested indexes, and verify those tests pass with `vp test`
- [x] 4.2 Add `src/routes/product-knowledge/$testId.tsx` that loads `getAssay`, renders name, specimen/regulatory badges, aliases, provenance, body in `whitespace-pre-wrap`, blank unpublished TAT/gene, calls `notFound()` for an unknown id, imports table/badge primitives from `@/` with no `Card`, and verify `vp check` type-checks the route
- [x] 4.3 Add `src/routes/market-intelligence/$eventId.tsx` that loads `getMarketEvent`, renders headline, tumor badge, date, why-now, and a relevant-tests table of assay `Link`s, calls `notFound()` for an unknown id, imports primitives from `@/` with no `Card`, and verify `vp check` type-checks the route
- [x] 4.4 Add `src/routes/crm/$noteId.tsx` that loads `getCrmNote`, renders date, channel badge, clinician name, body, and a sibling-notes table linking to other `/crm/$noteId` rows, calls `notFound()` for an unknown id, imports primitives from `@/` with no `Card`, and verify `vp check` type-checks the route

## 5. Brief links and sidebar

- [x] 5.1 Link brief related-assay names to `/product-knowledge/$testId` using `test_id`, keep unpublished TAT/gene blank, and verify the brief route still has no `Card` page chrome and still does not import `openai`
- [x] 5.2 Mark sidebar feed items active when `pathname === to || pathname.startsWith(to + "/")`, keep Home as exact `/`, and verify Product Knowledge stays current on an assay path while Home does not match `/crm`
- [x] 5.3 Let TanStack regenerate `src/routeTree.gen.ts` for the nested routes, commit that file, and verify it includes the three `$id` children

## 6. Integration

- [x] 6.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 6.2 Run `vp test` and verify CRM ingest, fixture coverage, payload, browse composition, ranked, and briefs tests pass
- [x] 6.3 Run `vp build` and verify the production build succeeds without `OPENAI_API_KEY`
- [x] 6.4 Run `vp dev` and in the browser verify: each browse list opens the matching detail page; MI provider names open `/providers/$npi`; assay pages show body and blank unpublished TAT for xT CDx; `gyn_hrd` shows why-now and assay links; `quinn-chen-tat` shows channel plus sibling notes; unknown ids 404 inside the sidebar; brief related assays open product pages; sidebar marks the feed current on a detail URL
