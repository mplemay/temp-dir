# Proposal

## Why

The three committed feeds (market intelligence, product knowledge, CRM notes) have no screens, so the app still looks like a starter card. A simple sidebar and one browse page per feed lets a user inspect the data the copilot will later join, without building ranking or briefs yet.

## What Changes

- Wrap every page in a shadcn sidebar with four links: Home, Market Intelligence, Product Knowledge, and CRM.
- Replace the starter “Project ready” home with a three-card overview that links to those feeds.
- Add one browse route per feed that renders accepted records from the existing loaders. Pages stay list-only: a provider table plus a small events card, assay cards, and note cards. No detail routes, filters, or ranking.
- Compose those screens from shadcn primitives (`Sidebar`, `Card`, `Table`, `Badge`). Add the primitives that are not already in the project.
- Load fixture data through TanStack Start server functions so Node `fs` loaders never run in the browser.

## Capabilities

### New Capabilities

- None. Navigation and browse screens belong on the existing app shell and design system. Ingest contracts stay on the existing feed capabilities.

### Modified Capabilities

- `app-shell`: Persistent sidebar navigation, new file-based routes for the three feeds, and a home overview instead of the starter ready page. Unknown routes still 404 inside the same shell.
- `design-system`: Shared sidebar chrome and section pages composed from Sidebar, Card, Table, and Badge. Drop the home-page dummy Continue button that must not navigate.

## Impact

- **Code**: `src/routes/__root.tsx` gains sidebar chrome; new routes for `/market-intelligence`, `/product-knowledge`, and `/crm`; `src/routes/index.tsx` becomes the overview; new `src/components/app-sidebar.tsx` (or equivalent). Server functions wrap the existing `loadMarketIntelligence`, `loadProductKnowledge`, and `loadCrmNotes` APIs. No fixture or schema changes.
- **UI**: shadcn `sidebar`, `table`, and `badge` (plus whatever those pull in). Existing `Card` and `Button` stay. Theme already has sidebar tokens.
- **Out of scope**: Ranked lists, objection handling, meeting scripts, detail pages, search/filters, nested sidebar items, auth, Salesforce, live APIs, PHI.
- **Assumption**: Home is a three-card overview, not a redirect into one feed. CRM notes show clinician name by joining NPI to market-intelligence providers; that is display-only and does not change the CRM ingest spec.
