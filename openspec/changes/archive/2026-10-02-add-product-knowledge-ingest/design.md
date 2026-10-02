# Design

## Context

See `proposal.md` for motivation. Specs are in `specs/product-knowledge/spec.md`.

Market intelligence already lives at `src/lib/market-intelligence/` with committed CSVs under `src/data/market-intelligence/`. Events carry `relevant_tests` as a semicolon-separated string (`xT`, `xT CDx`, `xF/xF+`, `HER2 IHC`, `HRD`) and tests assert those files have no TAT, gene-count, or accuracy columns. `src/routes/index.tsx` is still the placeholder home card. Zod and `csv-parse` are already in the app; there is no YAML/front-matter parser yet.

Constraints:

- Ingest is a server-side contract for later copilot features; this change does not add a page.
- Claim numbers are public marketing figures from tempus.com, not IFU or internal lab truth. Do not scrape at runtime.
- Do not attach assays onto provider records. Ranking and generation stay later changes.

## Goals / Non-Goals

**Goals:**

- One loader returns accepted assays and a skip report from committed markdown files.
- Alias lookup returns every assay that lists a token, including shared tokens such as `xF/xF+`.
- Committed-fixture tests prove every current market-intelligence event token resolves.

**Non-Goals:**

- RAG, embeddings, PDF parsing, or a live Tempus crawl.
- Generating objection copy or meeting scripts.
- A product hierarchy (parent/child SKUs). Thin add-on cards are enough.
- Treating published TAT/gene counts as clinical guarantees.

## Decisions

### 1. Colocate markdown cards under `src/data/product-knowledge/`

Paths:

```
src/data/product-knowledge/xt.md
src/data/product-knowledge/xt-cdx.md
src/data/product-knowledge/xf.md
src/data/product-knowledge/xf-plus.md
src/data/product-knowledge/her2-ihc.md
src/data/product-knowledge/hrd.md
src/lib/product-knowledge/schema.ts
src/lib/product-knowledge/load.ts
```

Filename stem MUST equal `test_id`. Loader reads `*.md` via `fs` from a directory resolved off `import.meta.url`, same as market intelligence. Missing directory throws; per-file failures skip.

**Why:** Same fixture home as the territory CSVs. Markdown matches the case-study source type. One file per assay keeps skip reports tied to a path.

**Alternatives:**

- One `catalog.md` with many documents. Fewer files; worse skip isolation.
- CSV of claims plus markdown bodies. Two formats for six assays.
- `public/` or `?raw` imports. Publishes the catalog as a static asset or couples tests to the bundler.

### 2. YAML front matter plus Zod; `gray-matter` to split

Parse each file with `gray-matter`, then validate `data` with Zod. Empty or missing body is a skip. Quote `retrieved_on` in YAML (`"2026-10-02"`) so js-yaml does not turn it into a Date.

Allow-lists:

- `specimen`: `tissue` | `liquid` | `other`
- `regulatory_status`: `fda_cdx` | `ldt` | `unknown`
- `tat_qualifier`: `typically_expected` | `from_specimen_receipt` | `unpublished`
- `source_url`: `http:` or `https:` URL whose hostname is `tempus.com` or ends with `.tempus.com`
- `gene_count` / `tat_days`: non-negative int or null
- When `tat_days` is null, `tat_qualifier` MUST be `unpublished`. When `tat_days` is set, qualifier MUST NOT be `unpublished`.

Load result shape:

```
{
  assays: AcceptedAssay[]
  report: { acceptedAssays, skipped: { source, reason }[] }
}
```

Duplicate `test_id`: first valid file wins (sorted by filename), later duplicates skip. Extra front-matter keys are ignored (including any NPI/volume/incumbent/CRM keys, which committed fixtures MUST NOT have).

**Why:** Front matter is the typed contract; the body is pitch prose. Zod skip reasons match market intelligence. `gray-matter` is the usual YAML-front-matter split.

**Alternatives:**

- Prose-only markdown. Cannot test that TAT came from the fixture.
- Hand-split `---` and the `yaml` package. Fine, one more custom parser.
- Claims CSV. Over-structures six rows.

### 3. Exact alias match; do not split on `/`

`eventTokens(relevant_tests)` splits on `;`, trims, and drops empties. `xF/xF+` is one token. `resolveAssays(token, assays)` returns every accepted assay whose `aliases` array includes that exact string.

Committed aliases:

| test_id  | aliases     |
| -------- | ----------- |
| xt       | xT          |
| xt-cdx   | xT CDx      |
| xf       | xF, xF/xF+  |
| xf-plus  | xF+, xF/xF+ |
| her2-ihc | HER2 IHC    |
| hrd      | HRD         |

Coverage is a committed-fixture test: load market intelligence, collect tokens, assert each resolves. It is not a throw inside `loadProductKnowledge`, so unit tests can load a subset of files.

**Why:** Events already use those strings. Splitting on `/` would invent a false join. Coverage as a test matches how territory size is enforced today.

**Alternatives:**

- One xf-family card. Loses distinct 105 vs 523 gene counts.
- Parent/child `parent_test_id`. Unused by any current consumer.
- Fail the load when coverage is incomplete. Couples the loader to the other fixture and breaks isolated tests.

### 4. Public numbers only; unpublished stays null

Author bodies from the public product pages; put only published figures in front matter.

| test_id  | specimen | gene_count | tat_days | tat_qualifier         | regulatory_status | source             |
| -------- | -------- | ---------- | -------- | --------------------- | ----------------- | ------------------ |
| xt       | tissue   | 648        | 9        | from_specimen_receipt | ldt               | /solutions/xt/     |
| xt-cdx   | tissue   | 648        | null     | unpublished           | fda_cdx           | /solutions/xt-cdx/ |
| xf       | liquid   | 105        | 6        | typically_expected    | ldt               | /solutions/xf/     |
| xf-plus  | liquid   | 523        | 6        | typically_expected    | ldt               | /solutions/xf/     |
| her2-ihc | other    | null       | null     | unpublished           | unknown           | /solutions/xt-cdx/ |
| hrd      | other    | null       | null     | unpublished           | unknown           | /solutions/xt-cdx/ |

HER2 IHC and HRD have no standalone Tempus product URL; they point at xT CDx and a one- or two-sentence body that they are findings reported with that assay. Do not guess a TAT for xT CDx.

**Why:** The case study wants metrics from the knowledge base. Inventing TAT would repeat the hallucination problem.

**Alternatives:**

- Drop HER2/HRD cards. Breaks the coverage requirement.
- Infer TAT from xT onto xT CDx. Spec forbids invented numbers.

### 5. Tests, not a route, prove the contract

Vitest covers schema allow-lists, null TAT, skip report, duplicate `test_id`, `xF/xF+` resolving to both liquid assays, missing-directory throw, committed-fixture coverage of event tokens, and absence of NPI/volume/incumbent/CRM keys in committed front matter. No new route; `app-shell` stays as-is.

## Risks / Trade-offs

- **[Risk] Public marketing numbers are read as IFU** → Mitigation: bodies say they are public Tempus site claims; `retrieved_on` is on every card; do not surface this feed in UI in this change.
- **[Risk] Thin add-on cards look like orderable SKUs** → Mitigation: `specimen: other` and body text that they are findings with xT CDx; no gene_count or TAT.
- **[Risk] js-yaml Date coercion on `retrieved_on`** → Mitigation: quote dates in fixtures; schema expects `YYYY-MM-DD` string.
- **[Trade-off] No runtime scrape** → Catalog can go stale; acceptable for a committed prototype. Refresh is editing markdown.
- **[Trade-off] `gray-matter` adds a dependency** → Cheapest way to get skip-reportable front matter without a custom splitter.

## Migration Plan

Add fixtures, loader, schema, and tests. No production data to migrate. Rollback is reverting the change. Later generation MUST call alias lookup rather than embedding assay numbers in prompts by hand.

## Open Questions

None. Assay grain, null unpublished TAT, thin HER2/HRD cards, and ingest-only scope are recorded in the proposal.
