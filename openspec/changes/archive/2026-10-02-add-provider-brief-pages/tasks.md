# Tasks

## 1. Layout

- [x] 1.1 Create `src/lib/provider-briefs/`, `src/data/provider-briefs/`, and `scripts/generate-briefs.ts` (script can be a stub until generate lands), and verify those paths exist and `.gitignore` still ignores `.env` while allowing `.env.example`

## 2. Artifact schema

- [x] 2.1 Implement Zod schemas in `src/lib/provider-briefs/schema.ts` for artifact metadata (`model` `gpt-6-luna`, `reasoning_effort` `medium`, `as_of`, `generated_at`) and brief rows (`npi`, `meeting_script` non-empty, `objection_response` string), then verify exported types compile under `vp check`
- [x] 2.2 Add schema unit tests that accept a valid artifact, reject an invalid NPI, reject a missing `meeting_script`, and accept an empty `objection_response`, then verify they pass with `vp test`

## 3. Copy grounding

- [x] 3.1 Export a field-agnostic `assertGroundedCopy` from `src/lib/ranked-providers/grounding.ts` that reuses the existing TAT / gene / percent-accuracy checks, keep `assertGroundedWhyNow` as a wrapper, and verify existing ranked grounding tests still pass with `vp test`
- [x] 3.2 Add provider-briefs grounding tests that reject an objection inventing a TAT number absent from the packet and accept an objection that cites a TAT present in the packet, then verify they pass with `vp test`

## 4. Runtime loader

- [x] 4.1 Implement `load.ts` to read `src/data/provider-briefs/briefs.json` via an `fs` path resolved from `import.meta.url` (overridable for tests), validate with Zod, require exact NPI coverage of `loadRankedProviders()`, join overview fields from ranked + market intelligence + CRM notes + product knowledge, throw if the file is missing or an NPI is not ranked, and verify the module source does not import `openai`
- [x] 4.2 Add loader tests that: load inline valid JSON joined to inline ranked providers; throw on a missing path; throw when a brief NPI is absent from the ranked list; throw when a ranked NPI is missing from briefs; succeed with `OPENAI_API_KEY` unset; and verify they pass with `vp test`

## 5. Offline generate (no network in tests)

- [x] 5.1 Implement generate helpers used by `scripts/generate-briefs.ts` that build packets from ranked rows + feeds, call OpenAI Responses only through an injectable client (`gpt-6-luna`, `reasoning.effort` `medium`, structured JSON schema), force `objection_response` to `""` when ranked `concern` is empty, abort without writing if a call, parse, coverage, empty-known-concern, or grounding check fails, and verify a unit test with a fake client produces one brief per ranked NPI
- [x] 5.2 Add generate unit tests that: force empty objection when concern is empty even if the fake client returns copy; abort when concern is non-empty and the fake client returns an empty objection; abort when copy invents a TAT not in the packet; accept Quinn-style copy that cites a packet TAT; and verify they pass with `vp test`
- [x] 5.3 Add `package.json` script `generate-briefs` (run via `vp run generate-briefs`) that loads ranked + three feeds, runs generate, and writes `src/data/provider-briefs/briefs.json`, then verify a missing-key run prints a clear error without calling the site runtime

## 6. Committed briefs artifact

- [x] 6.1 Run `vp run generate-briefs` with `OPENAI_API_KEY` set, commit `src/data/provider-briefs/briefs.json`, and verify the file records `model` `gpt-6-luna`, `reasoning_effort` `medium`, one row per ranked provider, every `meeting_script` non-empty, empty `objection_response` on NPIs whose ranked `concern` is empty, and non-empty objection for NPI `1600000004`
- [x] 6.2 Add fixture tests that load the committed JSON plus `loadRankedProviders()`, assert NPI coverage, metadata, providers without notes still have briefs, ranked `list.json` still has no `meeting_script` or `objection_response` field, and `vp test` passes those cases

## 7. Home worklist and brief page

- [x] 7.1 Add a `createServerFn({ method: "GET" })` `getProviderBrief` that takes an NPI and returns the joined brief, and verify `src/routes/index.tsx` and the new brief route do not import `loadProviderBriefs`, Node `fs` loaders, or `openai` directly
- [x] 7.2 Remove the three feed overview cards from `src/routes/index.tsx`, wrap each ranked name (or row) in a `Link` to `/providers/$npi`, and verify the home table still imports from `@/components/ui/table` with no Market Intelligence, Product Knowledge, or CRM card titles
- [x] 7.3 Add `src/routes/providers/$npi.tsx` that loads `getProviderBrief`, renders overview / meeting-script / objection `Card`s (objection card only when `objection_response` is non-empty; otherwise a no-known-concern line), calls TanStack `notFound()` for an unranked NPI, and verify card and badge imports come from `@/components/ui/`
- [x] 7.4 Confirm `src/routes/market-intelligence.tsx` still has no per-provider links and the sidebar still lists Home, Market Intelligence, Product Knowledge, and CRM

## 8. Integration

- [x] 8.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 8.2 Run `vp test` and verify provider-briefs tests plus existing ingest, ranking, and browse tests pass
- [x] 8.3 Run `vp build` and verify the production build succeeds without `OPENAI_API_KEY`
- [x] 8.4 Run `vp dev` and in the browser verify: `/` shows the ranked list with no feed cards; activating a row opens that provider’s brief with overview and meeting script; Quinn Chen (`1600000004`) shows a TAT objection; a no-CRM provider shows no drafted objection; `/providers/1699999999` 404s with the sidebar; sidebar feed pages still open
