# Tasks

## 1. shadcn primitives

- [x] 1.1 Run `pnpm dlx shadcn@latest add sidebar table badge` and verify `src/components/ui/sidebar.tsx`, `src/components/ui/table.tsx`, and `src/components/ui/badge.tsx` exist

## 2. App sidebar chrome

- [x] 2.1 Add `src/components/app-sidebar.tsx` with one `SidebarGroup` of Home, Market Intelligence, Product Knowledge, and CRM, using `SidebarMenuButton` `render={<Link ... />}` and `isActive` from the current path, then verify the file imports sidebar primitives from `@/components/ui/sidebar` and has those four labels
- [x] 2.2 Wrap `RootDocument` children with `SidebarProvider`, `AppSidebar`, and `SidebarInset`, keep `notFoundComponent` on the root route inside that chrome, and verify `__root.tsx` still sets charset, viewport, and a title while the 404 copy remains

## 3. Server functions and CRM name join

- [x] 3.1 Add a pure helper that maps note NPI to provider `full_name` without changing `AcceptedNote`, then verify a unit test covers a matching NPI getting the clinician name and an unknown NPI still returning the note body
- [x] 3.2 Add `createServerFn({ method: "GET" })` wrappers that call `loadMarketIntelligence`, `loadProductKnowledge`, and `loadCrmNotes` (CRM applies the name helper) and return accepted records only, then verify route modules do not import those `load*` functions directly and `vp test` still passes existing ingest tests

## 4. Browse routes

- [x] 4.1 Replace `src/routes/index.tsx` with three overview `Card`s (header, title, description, content) that navigate to the three feeds, then verify there is no “Project ready” heading, no dummy Continue button, and cards import from `@/components/ui/card`
- [x] 4.2 Add `src/routes/market-intelligence.tsx` with a loader calling the market server function, a provider `Table` (name, org, tumor focus, incumbent `Badge`, opportunity patients), and an events `Card` (headline, tumor type), then verify the route has no per-provider links and no rank column
- [x] 4.3 Add `src/routes/product-knowledge.tsx` with a loader calling the product server function and one `Card` per assay (display name, specimen `Badge`, regulatory `Badge`), omitting numeric TAT and gene count when null, then verify an assay with `tat_days: null` would not render a TAT number
- [x] 4.4 Add `src/routes/crm.tsx` with a loader calling the CRM server function and one `Card` per note (clinician name, date, body), then verify committed reserved NPIs would show a provider full name rather than NPI-only
- [x] 4.5 Regenerate and commit `src/routeTree.gen.ts` and verify it includes `/`, `/market-intelligence`, `/product-knowledge`, and `/crm`

## 5. Integration

- [x] 5.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 5.2 Run `vp test` and verify ingest tests plus the CRM name-join test pass
- [x] 5.3 Run `vp dev` and in the browser verify: `/` shows three feed cards; sidebar links reach each feed and mark the current item; market table and events render; assays render; CRM notes show clinician names; an unknown path still shows 404 plus the sidebar
- [x] 5.4 Run `vp build` and verify the production build succeeds
