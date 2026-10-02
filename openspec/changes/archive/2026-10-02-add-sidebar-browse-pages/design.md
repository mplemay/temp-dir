# Design

## Context

See `proposal.md` for motivation and `specs/app-shell/spec.md` plus `specs/design-system/spec.md` for behavior.

Current app: TanStack Start with `shellComponent` in `src/routes/__root.tsx`, a single `/` route, and shadcn `Card` + `Button` only. `components.json` is `base-nova` (Base UI, `render` not `asChild`), `rsc: false`, lucide icons. Sidebar color tokens already exist in `src/styles.css`.

The three feeds are ingest-only Node `fs` loaders under `src/lib/{market-intelligence,product-knowledge,crm-notes}/`. Start loaders are isomorphic, so those functions cannot be imported from route modules that ship to the client.

## Goals / Non-Goals

**Goals:**

- Put sidebar chrome in the document shell so home, feed pages, and 404 share one layout.
- Keep feed modules as the source of records; routes only display accepted data.
- Use shadcn composition (`Sidebar` + `Card` + `Table` + `Badge`) instead of custom nav or tables.

**Non-Goals:**

- Changing fixture schemas, skip reports, or ingest tests.
- Pathless route groups, icon-collapsed sidebar, nested nav, or per-record detail routes.
- React Query, RSC, or a new data layer.

## Decisions

### 1. Wrap chrome in `shellComponent`, not a pathless layout

Keep `shellComponent: RootDocument` and wrap `{children}` with `SidebarProvider`, `AppSidebar`, and `SidebarInset`. `notFoundComponent` stays on the root route so 404 still sits inside that chrome.

**Why:** Specs require the sidebar on every page including unknown routes. A pathless `_app` layout would not wrap root `notFoundComponent`.

**Alternatives:**

- Pathless `_app.tsx` layout. Cleaner file split, but 404 would miss the sidebar unless duplicated.
- Per-route sidebar. Repeats chrome and fails the shared-primitive requirement.

### 2. Flat four-item sidebar, `offcanvas` collapse

One `SidebarGroup` with Home, Market Intelligence, Product Knowledge, and CRM. `variant="sidebar"`, `collapsible="offcanvas"`. `SidebarMenuButton` uses Base UI `render={<Link to="..." />}` and `isActive` from the current pathname. Header label: Sales Copilot.

**Why:** Three feeds plus home do not need nested groups. `offcanvas` gives a mobile `Sheet` without icon-only chrome.

**Alternatives:**

- `collapsible="icon"`. Extra complexity for four items.
- One `SidebarGroup` per feed. Empty groups with a single child.

### 3. Sibling file routes

```
src/routes/__root.tsx
src/routes/index.tsx
src/routes/market-intelligence.tsx
src/routes/product-knowledge.tsx
src/routes/crm.tsx
src/components/app-sidebar.tsx
```

**Why:** Matches the existing flat `src/routes/` tree. `routeTree.gen.ts` regenerates on `vp dev` / `vp build` and stays committed.

**Alternatives:** Nested `market-intelligence/index.tsx` folders. No extra child routes to justify them.

### 4. Server functions wrap existing loaders; routes stay presentational

Add `createServerFn({ method: "GET" })` handlers that call `loadMarketIntelligence`, `loadProductKnowledge`, and `loadCrmNotes`. Route `loader`s call those functions. Return only accepted records (and a CRM view model), not skip reports.

CRM display join lives in a small pure helper: map `npi` → `full_name` from accepted providers, attach `clinician_name` on a view record. Do not change `AcceptedNote` or the CRM schema.

**Why:** Start documents `createServerFn` as the boundary for Node `fs`. A pure join helper can be unit-tested without rendering.

**Alternatives:**

- Call `load*` from an isomorphic loader. Bundles `fs` into the client.
- Push the name join into `crm-notes`. Mixes ingest with UI.

### 5. Page composition

| Page                   | Composition                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Three `Card`s (header, title, description, content). The Market Intelligence card (and the others) is the navigation control — wrap with `Link` via `render` or an inner link, not a dummy non-navigating button. |
| `/market-intelligence` | `Table` of providers: name, org, tumor focus, incumbent `Badge`, `opportunity_patients`. Separate `Card` listing event headline + tumor type. Loader order is fixture order, not a rank.                          |
| `/product-knowledge`   | One `Card` per assay: display name, specimen `Badge`, regulatory `Badge`. If `tat_days` is null, omit any number (label unpublished). Same for null `gene_count`.                                                 |
| `/crm`                 | One `Card` per note: clinician name, date, body.                                                                                                                                                                  |

Add primitives with `pnpm dlx shadcn@latest add sidebar table badge`. Do not hand-roll those. Follow existing shadcn rules: `flex` + `gap-*`, semantic tokens, full Card composition, no `space-y-*`.

**Alternatives:**

- Home as a redirect to market intelligence. Rejected; specs require an overview.
- Dump every provider column. Specs name a short field set.

### 6. Verification stays on ingest tests plus `vp check` and a browser pass

Existing `src/lib/**/*.test.ts` files stay. Add a focused unit test for the CRM name-join helper. Do not add a Playwright suite in this change. Apply verifies sidebar and pages in the browser against `vp dev`.

## Risks / Trade-offs

- [Loader imports `fs` into the client] → Only call load functions inside `createServerFn` handlers. If `vp build` warns about server code in the client, move the server fns to a file that is not imported from client-only modules.
- [shadcn `sidebar` pulls Sheet, Tooltip, Separator, Skeleton] → Accept the CLI dependency set; do not vendor a thinner nav.
- [52-row provider table without virtualization] → Fine at committed fixture size. Revisit only if the territory grows much larger.
- [`routeTree.gen.ts` drift] → Commit the regenerated file after the new routes exist.

## Migration Plan

1. Add shadcn primitives; add `AppSidebar` and wrap `RootDocument`.
2. Replace the home route; add the three feed routes and server functions.
3. `vp check` and `vp test`. Browse `/`, each feed, and a missing path on `vp dev`.

Rollback: revert the change commit. No production deploy and no fixture migration.

## Open Questions

None. Home-as-overview, flat nav, and the CRM name join are recorded in the proposal and specs.
