# Design

## Context

See `proposal.md` for motivation and `specs/ranked-providers/spec.md` plus the home-page delta in `specs/app-shell/spec.md` for behavior.

The three feeds already load from committed fixtures (`src/lib/{market-intelligence,product-knowledge,crm-notes}/`). Derived `opportunity_patients` and `matched_events` exist; `est_ngs_testing_rate` is stored and unused. Home (`src/routes/index.tsx`) is a three-card feed index. The market-intelligence browse page is specified not to rank. Browse data already goes through TanStack Start server functions in `src/lib/browse/server.ts` so Node `fs` loaders never run in the browser. `.env` is gitignored; `!.env.example` is allowed.

GPT-6 Luna (`gpt-6-luna`) is a reasoning model. Chat Completions function calling is only supported when `reasoning_effort` is `none`. This pipeline needs `medium` effort and structured output, so it uses the Responses API.

## Goals / Non-Goals

**Goals:**

- Rank every accepted provider with a documented mix formula, then freeze order before writing why-now copy.
- Keep OpenAI behind a generate script that writes `src/data/ranked-providers/list.json`. Runtime load is JSON + join.
- Reuse existing shadcn `Table`, `Badge`, and `Card` on home. No new primitive.

**Non-Goals:**

- Changing feed schemas, skip reports, or the market-intelligence page order.
- Calling OpenAI from `vp dev`, `vp build`, or route loaders.
- Provider detail routes, objection handling, or meeting scripts.

## Decisions

### 1. NPI-keyed ranking artifact, display joined at read time

Commit:

```
src/data/ranked-providers/list.json
```

Artifact fields: `generated_at`, `model`, `reasoning_effort`, `as_of`, and `providers[]` with `rank`, `npi`, `impact_score`, `score_breakdown`, `readiness`, `concern`, `interest`, `why_now`, `has_crm`. Identity fields (`full_name`, `org_name`, tumor focus, incumbent, `opportunity_patients`) are joined from `loadMarketIntelligence()` in the ranked loader so the CSV remains source of truth for names and volume.

Runtime `loadRankedProviders()` reads JSON with `fs` from a path resolved off `import.meta.url` (same pattern as the other fixtures), validates with Zod, joins, and fails closed if the file is missing or an NPI does not match an accepted provider.

**Why:** Ranking-layer copy and scores must not be written back onto `providers.csv`. Joining at SSR keeps identity and opportunity in one place.

**Alternatives:**

- Denormalize name/org into the JSON. Simpler home loader; drifts when the territory file is edited.
- Put `rank` on the provider CSV. Forbidden by market-intelligence (extra rank columns are ignored) and by this change’s spec.

### 2. Mix formula (deterministic)

As-of date for generation metadata: `2026-10-02`.

```
ngs_gap_factor     = 0.7 + 0.3 * (1 - est_ngs_testing_rate)
incumbent_weight   = FMI|Caris|Guardant 1.25
                   | unknown 1.15
                   | in_house 1.10
                   | Tempus 0.75
event_boost        = 1.15 if matched_events.length > 0 else 1.0
crm_multiplier     = switch 1.35 | expand 1.20 | unknown 1.0 | retain 0.55

impact_score = opportunity_patients
             * ngs_gap_factor
             * incumbent_weight
             * event_boost
             * crm_multiplier
```

Tie-break: higher `opportunity_patients`, then NPI ascending. Mixed-focus providers still get every event, but `event_boost` is a boolean presence flag, not a count, so Harper’s six events do not 6x the score.

Clamp extracted readiness with traditional guards before scoring:

- Incumbent Tempus and extracted `switch` → `expand`
- Competitor incumbent (FMI, Caris, Guardant) and extracted `retain` → `switch`

`score.ts` is a pure function of accepted provider fields plus readiness. It MUST NOT take `tat_days` or `gene_count`.

**Why:** Volume is the backbone; undertest is a mild factor (0.7–1.0) so a high-NGS Guardant thoracic doc is not crushed. CRM readiness is what drops a large already-Tempus retain account below a smaller why-now switch.

**Alternatives:**

- Sort by `opportunity_patients` only. Harper wins; contradicts “Why Tempus, Why Now.”
- Multiply by raw `(1 - est_ngs_testing_rate)`. High-testing lung docs collapse.
- LLM assigns the rank. Non-reproducible; model can invent impact.

### 3. Two OpenAI calls, order frozen between them

Generate pipeline (`scripts/rank-providers.ts`, `vp run rank-providers`):

```
load feeds
  --> extract CRM signals (Responses, gpt-6-luna, reasoning.effort=medium)
        only NPIs with notes; schema: npi, readiness, concern, interest
  --> clamp readiness
  --> score all providers (unknown readiness if no notes)
  --> sort, assign rank 1..N
  --> explain why_now (Responses, same model/effort)
        packet: frozen rank, score breakdown, org, tumor, incumbent,
        matched event headlines, extracted signals, assay display names
        for matched event tokens (names only, TAT/gene only if present
        on the assay record)
  --> write list.json
```

Use the official `openai` SDK as a **devDependency**. Structured Outputs (`text.format` json_schema) on the Responses API. Do not use Chat Completions for this script: `medium` reasoning is unsupported with tools/function calling there.

Extract prompt contract: only the note `body` and `note_date` plus NPI; never volumes, TAT, or rank. Explain prompt contract: do not change rank; do not invent numeric TAT, gene count, or accuracy; if those numbers are absent from the packet, omit them.

If either OpenAI call fails or JSON does not parse, abort and do not overwrite `list.json`.

**Why:** Extraction can affect the score (readiness). Explanation must not. Splitting the calls makes that ordering explicit.

**Alternatives:**

- One call that returns rank + copy. The model would own ordering.
- Explain-only, heuristic readiness from keywords. Weaker on unstructured notes; worse GenAI story.
- Per-provider calls. Unnecessary with Luna’s context window; 8 notes + ~50 packets fit one or two requests.

### 4. Home reads the artifact through a server function

Add `getRankedProviders` next to the existing browse server functions. `src/routes/index.tsx` gains a loader. Render a `Table` (rank, name, organization, tumor focus, incumbent `Badge`, opportunity patients, why-now) then keep the three feed `Card` links below. Rows are not `Link`s to a detail route.

**Why:** Same SSR pattern as the browse pages. Market intelligence stays fixture order.

**Alternatives:**

- Rank on the market-intelligence page. Conflicts with the existing “MUST NOT rank” requirement.
- Client fetch of `/list.json` from `public/`. Publishes the artifact as a static URL and skips join-time validation.

### 5. Tests never call OpenAI

- `score.test.ts`: formula examples, Tempus retain vs competitor switch ordering, omitting assay metrics from the function signature.
- `load.test.ts` / fixture tests: schema, coverage of accepted NPIs, unique ranks, metadata `gpt-6-luna` / `medium`, missing file throws, provider CSV still has no rank column.
- Generate unit tests inject a fake Responses client (no network).
- Home tests, if any, assert loader data includes ranked names; no `openai` import from `load.ts` or route modules.

Generating `list.json` during apply requires `OPENAI_API_KEY` in `.env` (gitignored). `vp test` and `vp build` MUST NOT require it.

## Risks / Trade-offs

- **[Risk] Formula still ranks Harper first** → Mitigation: unit test the retain-vs-switch case; fixture assertion that NPI `1600000007` is not rank 1 after generate.
- **[Risk] Why-now invents TAT** → Mitigation: packet only includes published assay numbers; post-check rejects `why_now` that matches a turnaround/gene/accuracy number not in the packet.
- **[Risk] `openai` ships to the browser** → Mitigation: import the SDK only from `scripts/rank-providers.ts`; runtime `load.ts` stays `fs` + Zod; test that load module source has no `openai` import.
- **[Risk] Artifact drifts from feeds** → Mitigation: fixture test that ranked NPI set equals accepted provider NPI set.
- **[Trade-off] Ranked JSON is a generated snapshot** → Regeneration is a documented script, not a lifecycle hook, so CI and `vp dev` stay keyless.

## Migration Plan

Add schema, score, load, script, `.env.example` with `OPENAI_API_KEY=`, generate and commit `list.json`, then wire the home loader. Rollback is reverting the change. No production data to migrate.

## Open Questions

None. Mix weights, `gpt-6-luna` + medium effort, full-territory ranking, and home-as-worklist are recorded as decisions.
