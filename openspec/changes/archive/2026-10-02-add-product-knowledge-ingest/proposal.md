# Proposal

## Why

The copilot still cannot cite Tempus test performance. Market intelligence already names assays in `relevant_tests` and forbids TAT, gene-panel size, and CDx claims on those CSVs, so objection handling and meeting scripts have nowhere truthful to pull numbers from. This change adds a committed product knowledge base so later briefs can resolve those tokens to public assay facts instead of inventing them.

## What Changes

- Add committed markdown assay cards (YAML front matter plus a short body) sourced from public Tempus product pages, covering every test token already used in the market-intelligence events fixture.
- Load those files at runtime, validate identity and claim fields, skip invalid files with a report, and resolve aliases so an event token such as `xT CDx` or `xF/xF+` maps to accepted assays.
- Keep metrics nullable when Tempus does not publish them (for example xT CDx turnaround time). Do not invent numbers.
- Keep ranking, objection generation, meeting scripts, CRM notes, live website scrape, RAG, PDF parsing, and UI out of this change.

## Capabilities

### New Capabilities

- `product-knowledge`: Load, validate, and expose a small catalog of Tempus assays with public performance claims, provenance, and aliases that join to market-intelligence `relevant_tests` tokens. Owns the ingest contract; does not own generation or ranking.

### Modified Capabilities

- None. `market-intelligence` stays the owner of providers and events; this change reads those event tokens as a coverage invariant rather than changing that spec. `app-shell` and `design-system` stay unchanged. This change does not add a user-facing route.

## Impact

- **Code**: New markdown fixtures under a committed path, plus a server-side loader/schema module (likely `src/lib/product-knowledge/`). No route or UI changes.
- **Data**: One markdown file per orderable assay needed for the current events fixture (`xT`, `xT CDx`, `xF`, `xF+`, plus thin cards for `HER2 IHC` and `HRD`). Bodies adapted from tempus.com; claim fields are public marketing numbers, not IFU or internal lab truth.
- **Dependencies**: YAML front-matter parsing in addition to existing Zod. No live Tempus CMS, no PDF parser, no embeddings.
- **Out of scope**: Ranked provider list, objection handler, meeting script, CRM notes ingest, file-upload UI, runtime scrape, RAG/vector search, PDF ingest, full Tempus catalog (nP, germline, imaging, data).
- **Assumptions**: Explore agreed ingest-only assay cards with typed front matter; unpublished TAT stays null rather than guessed; HER2 IHC and HRD are thin cards so event tokens resolve without a product hierarchy.
