# Tasks

## 1. Dependencies and layout

- [x] 1.1 Add the official `openai` package as a devDependency with `vp add` (or the Vite+ equivalent) and verify it appears under `devDependencies` in `package.json`
- [x] 1.2 Create `src/lib/ranked-providers/`, `src/data/ranked-providers/`, and `scripts/`, add `.env.example` with `OPENAI_API_KEY=`, and verify those paths exist and `.gitignore` still ignores `.env` while allowing `.env.example`

## 2. Artifact schema

- [x] 2.1 Implement Zod schemas in `src/lib/ranked-providers/schema.ts` for artifact metadata (`model` `gpt-6-luna`, `reasoning_effort` `medium`, `as_of`, `generated_at`) and ranked rows (`rank`, `npi`, `impact_score`, `score_breakdown`, `readiness` enum, `concern`, `interest`, `why_now`, `has_crm`), then verify exported types compile under `vp check`
- [x] 2.2 Add schema unit tests that accept a valid artifact, reject an invalid NPI, reject `readiness` outside `switch|expand|retain|unknown`, and reject missing `why_now`, then verify they pass with `vp test`

## 3. Mix score

- [x] 3.1 Implement `score.ts` with the design.md formula (`ngs_gap_factor`, incumbent weights, event presence boost, CRM multipliers) plus readiness clamps (Tempus+`switch`→`expand`, competitor+`retain`→`switch`), and verify the function does not accept `tat_days` or `gene_count` arguments
- [x] 3.2 Add unit tests that: compute a known numeric example from the formula; rank a high-opportunity Tempus `retain` below a lower-opportunity competitor `switch` with a matched event; leave readiness `unknown` when no notes; and verify those tests pass with `vp test`

## 4. Runtime loader

- [x] 4.1 Implement `load.ts` to read `src/data/ranked-providers/list.json` via an `fs` path resolved from `import.meta.url` (overridable for tests), validate with Zod, join display fields from `loadMarketIntelligence()`, return records in rank order, throw if the file is missing or an NPI is not an accepted provider, and verify the module source does not import `openai`
- [x] 4.2 Add loader tests that: load inline valid JSON joined to inline providers; throw on a missing path; throw when a ranked NPI is absent from accepted providers; succeed with `OPENAI_API_KEY` unset; and verify they pass with `vp test`

## 5. Offline generate (no network in tests)

- [x] 5.1 Implement extract, clamp, score/sort, explain, and write helpers used by `scripts/rank-providers.ts`, calling the OpenAI Responses API only through an injectable client (`gpt-6-luna`, `reasoning.effort` `medium`, structured JSON schema), aborting without writing if a call or parse fails, and verify a unit test with a fake client produces ranks then why-now without changing order
- [x] 5.2 Add a why-now post-check that rejects copy containing a numeric turnaround, gene-count, or accuracy claim not present in the packet, then verify a unit test fails that case and passes grounded copy
- [x] 5.3 Add `package.json` script `rank-providers` (run via `vp run rank-providers`) that loads the three committed feeds, runs generate, and writes `src/data/ranked-providers/list.json`, then verify `vp run rank-providers --help` or a dry missing-key run prints a clear error without calling the site runtime

## 6. Committed ranked artifact

- [x] 6.1 Run `vp run rank-providers` with `OPENAI_API_KEY` set, commit `src/data/ranked-providers/list.json`, and verify the file records `model` `gpt-6-luna`, `reasoning_effort` `medium`, one row per accepted provider, unique ranks 1..N, non-empty `why_now`, `unknown` readiness on NPIs with no notes, and NPI `1600000007` is not rank 1
- [x] 6.2 Add fixture tests that load the committed JSON plus `loadMarketIntelligence()`, assert NPI coverage, metadata, no `rank`/`impact_score` column on `providers.csv`, providers without notes still appear, and `vp test` passes those cases

## 7. Home worklist

- [x] 7.1 Add a `createServerFn({ method: "GET" })` wrapper that calls `loadRankedProviders()` and verify `src/routes/index.tsx` does not import `loadRankedProviders` or `openai` directly
- [x] 7.2 Replace the home hero with a ranked `Table` (rank, name, organization, tumor focus, incumbent `Badge`, opportunity patients, why-now) and keep the three feed overview `Card`s below, with no per-provider detail links, then verify the table imports from `@/components/ui/table` and cards still navigate to the three feeds
- [x] 7.3 Confirm `src/routes/market-intelligence.tsx` is still fixture order with no rank column and no per-provider links

## 8. Integration

- [x] 8.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 8.2 Run `vp test` and verify ranked-providers tests plus existing ingest and browse tests pass
- [x] 8.3 Run `vp build` and verify the production build succeeds without `OPENAI_API_KEY`
- [x] 8.4 Run `vp dev` and in the browser verify: `/` shows the ranked list in rank order with why-now copy; feed cards still open Market Intelligence, Product Knowledge, and CRM; the market-intelligence page is still unranked; an unknown path still 404s with the sidebar
