# Design

## Context

See `proposal.md` for motivation and `specs/provider-briefs/spec.md`, plus the home and brief-page deltas in `specs/app-shell/spec.md` and `specs/design-system/spec.md`.

Home (`src/routes/index.tsx`) already loads the ranked list through `getRankedProviders` in `src/lib/browse/server.ts`. Rows are not links. Three feed `Card`s sit below the table; sidebar still reaches `/market-intelligence`, `/product-knowledge`, and `/crm`. Ranked generate (`scripts/rank-providers.ts`) uses the OpenAI Responses API (`gpt-6-luna`, `reasoning.effort` `medium`, `zodTextFormat`) and writes `src/data/ranked-providers/list.json`. Runtime loaders never import `openai`. CRM notes exist for eight reserved NPIs; Quinn Chen (`1600000004`) is the TAT-vs-Guardant showcase. Product-knowledge assays already carry published `tat_days` / `gene_count` (nullable when unpublished). `assertGroundedWhyNow` in `src/lib/ranked-providers/grounding.ts` rejects invented TAT, gene, and percent-accuracy claims.

There is no dynamic route yet. Unknown paths use `__root.tsx` `notFoundComponent`. `.env` is gitignored; `!.env.example` is allowed.

## Goals / Non-Goals

**Goals:**

- Commit an NPI-keyed briefs artifact generated offline; join overview at read time from existing feeds and the ranked list.
- Force empty `objection_response` when ranked `concern` is empty, regardless of model output.
- Reuse shadcn `Table`, `Card`, `Badge`, and `Link`. No new primitive.

**Non-Goals:**

- Changing mix scores, ranks, feed schemas, or browse-page order.
- Calling OpenAI from `vp dev`, `vp build`, or route loaders.
- Deleting sidebar feed links or browse routes.
- Writing brief copy onto `list.json` or source CSVs.

## Decisions

### 1. Sibling briefs artifact, display joined at read time

Commit:

```
src/data/provider-briefs/briefs.json
```

Artifact fields: `generated_at`, `model`, `reasoning_effort`, `as_of`, and `briefs[]` with `npi`, `meeting_script`, `objection_response`. Identity, rank, why-now, CRM notes, matched events, and assay facts are joined in the loader from `loadRankedProviders()`, `loadMarketIntelligence()`, `loadCrmNotes()`, and `loadProductKnowledge()`.

Runtime `loadProviderBriefs()` / `loadProviderBrief(npi)` read JSON with `fs` from a path resolved off `import.meta.url`, validate with Zod, require exact NPI coverage of the ranked list, and fail closed if the file is missing or an NPI does not match a ranked provider.

**Why:** Ranking already forbids owning per-provider briefs. Joining at SSR keeps names, volume, and notes in one source of truth.

**Alternatives:**

- Append `meeting_script` / `objection_response` to `list.json`. Violates ranked-providers “does not own briefs” and mixes score snapshots with copilot copy.
- Per-NPI JSON files. Harder coverage checks; 52 files for no gain.

### 2. One Responses call; empty objections are a traditional guard

Generate pipeline (`scripts/generate-briefs.ts`, `vp run generate-briefs`):

```
load ranked list + three feeds
  --> build one packet per ranked NPI
        (org, specialty, tumor, incumbent, why_now,
         concern, interest, matched event headlines,
         assay display names; TAT/gene only if published)
  --> one Responses parse (gpt-6-luna, medium, json_schema)
        schema: briefs[] of { npi, meeting_script, objection_response }
  --> for each ranked NPI:
        missing row -> abort
        concern empty -> force objection_response to ""
        concern non-empty and objection empty -> abort
        assertGroundedCopy on both fields
  --> write briefs.json
```

Reuse the injectable `StructuredParseClient` shape from ranked generate (or an equivalent in `provider-briefs/generate.ts`). Import `openai` only from the script. Abort without overwrite if the call fails, JSON does not parse, coverage is incomplete, or grounding fails.

Prompt contract: 30-second spoken meeting script (~75 words); objection is a drafted reply to the stated concern using only packet metrics; do not invent numeric TAT, gene count, or accuracy; if `concern` is empty, return `objection_response` as `""`.

`as_of` matches ranking: `2026-10-02`.

**Why:** Extraction already happened in ranking. Briefs must not change ranks. One call fits Luna’s window (52 packets). Forcing empty objections in code is the only way to meet “MUST NOT invent a concern” if the model embellishes.

**Alternatives:**

- Two calls (scripts vs objections). Extra latency; objections are only eight rows.
- Fold into `rank-providers.ts`. Couples regenerate-ranks with regenerate-copy; a why-now tweak would rewrite briefs.
- Generate objections from incumbent when CRM is empty. Forbidden by spec.

### 3. Generalize copy grounding; do not invent a second regex set

Export a field-agnostic `assertGroundedCopy(text, packet)` from `src/lib/ranked-providers/grounding.ts` (thin rename/wrapper around the existing TAT / gene / percent checks). Provider-briefs generate calls it for `meeting_script` and `objection_response`. Keep `assertGroundedWhyNow` as a wrapper so existing ranked tests stay stable.

**Why:** Quinn’s TAT citation must use the same allow-list as why-now. Two copies of the regexes will drift.

**Alternatives:**

- Duplicate the helper under `provider-briefs/`. Simpler import graph; worse for the case-study metric.

### 4. Brief route and home links

Add `src/routes/providers/$npi.tsx`. Loader validates a 10-digit NPI param, calls `getProviderBrief({ data: { npi } })`, and throws TanStack `notFound()` when the NPI is absent from the ranked list or the briefs artifact.

`getProviderBrief` lives next to the other browse server functions. It returns the joined overview (name, org, specialty, location, tumor, incumbent, rank, opportunity, why-now, matched events, CRM notes, related assay display names) plus `meeting_script` and `objection_response`. Route modules MUST NOT import `openai` or Node `fs` loaders.

Home: wrap each name (or row) in `Link` to `/providers/$npi`. Delete the `feeds` card grid. Keep the ranked `Table` columns as they are.

Brief page: heading with name and rank; `Card`s for overview, meeting script, and objection (objection card only when `objection_response` is non-empty; otherwise a short “no known concern” line). Incumbent as `Badge`. No new UI primitive.

Sidebar is unchanged. Market-intelligence rows stay unlinked.

**Why:** Same SSR pattern as browse pages. Cards on home competed with the worklist; sidebar still exposes feeds for the demo.

**Alternatives:**

- Query-string `/?npi=`. Weaker shareable URL; not a real page.
- Link from the market-intelligence table too. Conflicts with its “MUST NOT open a per-provider detail route” requirement.

### 5. Tests never call OpenAI

- Schema tests: valid artifact; reject bad NPI; reject missing meeting_script; accept empty objection_response.
- Load tests: coverage equals ranked NPIs; missing file throws; unknown NPI throws; load module source has no `openai` import; succeeds with `OPENAI_API_KEY` unset.
- Generate unit tests inject a fake Responses client. Assert empty concern → forced `""`; non-empty concern with empty model objection aborts; invented TAT in objection fails grounding; Quinn packet with published TAT accepts a response that cites that number.
- Fixture tests on committed `briefs.json`: metadata `gpt-6-luna` / `medium`; NPI set equals ranked set; every `meeting_script` non-empty; NPIs with empty ranked concern have empty objection; `1600000004` has a non-empty objection; ranked `list.json` still has no `meeting_script` field.
- No network in `vp test`. Generating during apply requires `OPENAI_API_KEY` in `.env`.

## Risks / Trade-offs

- **[Risk] Model invents a TAT in the Quinn objection** → Mitigation: packet only includes published assay numbers; `assertGroundedCopy` rejects numbers not in the packet; fixture test on `1600000004`.
- **[Risk] Model writes an objection for unknown-readiness rows** → Mitigation: generate step overwrites `objection_response` to `""` whenever ranked `concern` is empty.
- **[Risk] `openai` ships to the browser** → Mitigation: SDK imported only from `scripts/generate-briefs.ts`; runtime `load.ts` is `fs` + Zod; test load module source.
- **[Risk] Briefs drift from ranks after a re-rank** → Mitigation: load fails closed unless brief NPIs exactly match ranked NPIs; regenerate briefs after regenerating ranks.
- **[Trade-off] Briefs JSON is a generated snapshot** → Regeneration is a documented script, not a lifecycle hook, so CI and `vp dev` stay keyless.

## Migration Plan

Add schema, generate, load, and `vp run generate-briefs`; run it with `OPENAI_API_KEY`; commit `briefs.json`; wire home links and the `$npi` route. Rollback is reverting the change. No production data to migrate.

## Open Questions

None. Meeting script on the same page, empty objections without CRM concern, sibling artifact, and `gpt-6-luna` / medium effort are recorded as decisions.
