# Tasks

## 1. Dependencies and module layout

- [x] 1.1 Add `gray-matter` with `vp add` (or the Vite+ equivalent) and verify it appears in `package.json` and installs cleanly
- [x] 1.2 Create `src/lib/product-knowledge/` and `src/data/product-knowledge/` and verify those directories exist

## 2. Schemas

- [x] 2.1 Implement Zod enums and objects in `src/lib/product-knowledge/schema.ts` for assay front matter (`test_id`, `display_name`, non-empty `aliases`, `specimen`, `regulatory_status`, nullable `gene_count`/`tat_days`, `tat_qualifier` rules from design.md, `source_url` on `tempus.com` or a subdomain, `retrieved_on` as `YYYY-MM-DD`) plus a non-empty `body`, and verify exported types compile under `vp check`
- [x] 2.2 Add schema unit tests that accept a valid assay with `tat_days` 6, accept omitted TAT as null with `unpublished`, reject negative `gene_count`, reject invalid `regulatory_status`, reject missing `source_url`, reject a non-Tempus host, reject `tat_days` set with `unpublished`, and verify those tests pass with `vp test`

## 3. Loader and alias lookup

- [x] 3.1 Implement `load.ts` to read `*.md` from a directory resolved off `import.meta.url` (overridable for tests), parse with `gray-matter`, validate with Zod, skip invalid files with `{ source, reason }`, treat duplicate `test_id` as skip-after-first (filename sort), skip empty body, ignore extra front-matter keys, and throw if the directory is missing — then verify that implementation is exported
- [x] 3.2 Implement `eventTokens` (split `relevant_tests` on `;`, trim, drop empties) and `resolveAssays` (exact alias match, multiple assays allowed) in the same module, and verify unit tests pass with `vp test` for: `xF/xF+` returning both liquid assays, `xF` returning only xF, and `nP` returning none
- [x] 3.3 Add loader tests that: load a temp directory of valid markdown; skip bad regulatory status / missing `test_id` / empty body while keeping valid files; skip a duplicate `test_id`; preserve body text; leave omitted `tat_days` as null; throw when the directory is missing — and verify they pass with `vp test`

## 4. Committed assay fixtures

- [x] 4.1 Write the six markdown cards in `src/data/product-knowledge/` (`xt.md`, `xt-cdx.md`, `xf.md`, `xf-plus.md`, `her2-ihc.md`, `hrd.md`) with filename stem equal to `test_id`, quoted `retrieved_on`, aliases and claim fields from design.md, tempus.com `source_url`s, and non-empty bodies adapted from the public product pages (thin add-on wording for HER2 IHC and HRD), then verify a load of the committed directory accepts all six with no skips
- [x] 4.2 Add fixture tests that load the committed files plus `loadMarketIntelligence()`, assert every `relevant_tests` token resolves, `xt-cdx` has null `tat_days`, committed front matter has no NPI/volume/incumbent/CRM keys, accepted ids are exactly the six event-token assays, and `vp test` passes those cases

## 5. Integration

- [x] 5.1 Run `vp test` and verify the full product-knowledge suite and existing market-intelligence tests pass
- [x] 5.2 Run `vp check` and verify format, lint, and type-check pass
- [x] 5.3 Confirm `src/routes/index.tsx` is unchanged (still the placeholder home card) so this change added no user-facing route
