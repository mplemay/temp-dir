# design-system Specification

## Purpose

Defines the shared UI system for the application: tokenized theming and reusable primitives that routes compose instead of one-off styled markup.

## Requirements

### Requirement: Tokenized theme

The application SHALL style pages with semantic color and typography tokens (for example background, foreground, and muted text) rather than hard-coded palette utilities on page layouts.

#### Scenario: Home page uses theme tokens

- **WHEN** a user views `/`
- **THEN** the page background and text colors come from the shared theme tokens

### Requirement: Shared UI primitives on the overview home

The home page SHALL be composed from shared UI primitives, including a table for the ranked provider list and a badge for incumbent lab. The home page MUST NOT use feed overview cards as its primary navigation.

#### Scenario: Home table

- **WHEN** a user opens `/`
- **THEN** ranked providers appear in a shared table, and incumbent lab is shown with a shared badge

#### Scenario: Home has no feed cards

- **WHEN** a user opens `/`
- **THEN** they do not see cards titled Market Intelligence, Product Knowledge, or CRM

### Requirement: Component source of truth

Shared UI primitives SHALL live in the project as source files that routes import through a stable `@/` alias, so new screens reuse the same components.

#### Scenario: Route imports primitives

- **WHEN** a developer adds or inspects the home route
- **THEN** table, badge, and input primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Browse pages import primitives

- **WHEN** a developer inspects a feed browse route
- **THEN** table and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Brief page imports primitives

- **WHEN** a developer inspects the provider brief route
- **THEN** table and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Feed detail pages import primitives

- **WHEN** a developer inspects an assay, market-event, or CRM-note detail route
- **THEN** table and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

### Requirement: Shared sidebar chrome

The application chrome SHALL be composed from the shared sidebar primitive, with navigation items and a main content inset, not custom nav markup.

#### Scenario: Sidebar primitive on a feed page

- **WHEN** a user views the market intelligence page
- **THEN** the navigation is the shared sidebar, and the page content sits in the main inset beside it

### Requirement: Shared primitives on browse pages

Feed browse pages SHALL be composed from shared table and badge primitives rather than one-off styled lists or stacked cards.

#### Scenario: Market intelligence table

- **WHEN** a user views the market intelligence page
- **THEN** providers appear in a shared table, and incumbent lab is shown with a shared badge

#### Scenario: Market events table

- **WHEN** a user views the market intelligence page
- **THEN** market events appear in a shared table with headline and tumor type

#### Scenario: Product knowledge table

- **WHEN** a user views the product knowledge page
- **THEN** assays appear in a shared table with specimen and regulatory status as shared badges

#### Scenario: CRM notes table

- **WHEN** a user views the CRM page
- **THEN** notes appear in a shared table

### Requirement: Shared primitives on the provider brief page

The provider brief page SHALL place the meeting script and objection handler in a talk-track column beside a snapshot of why-now, ranked signals, matched events, and related assays. CRM notes SHALL appear in a shared table. The page MUST NOT use stacked cards as the primary composition.

#### Scenario: Talk track beside snapshot

- **WHEN** a user views a ranked provider’s brief page
- **THEN** the meeting script appears beside why-now and ranked signals rather than in a stacked card below an overview card

#### Scenario: Nested lists use tables

- **WHEN** a user views a ranked provider’s brief page that has CRM notes, matched events, or related assays
- **THEN** those items appear in a shared table, not in nested cards

#### Scenario: Badges on the brief

- **WHEN** a user views a ranked provider’s brief page
- **THEN** incumbent lab and readiness are shown with shared badges

### Requirement: Shared primitives on feed detail pages

Assay, market-event, and CRM-note pages SHALL be composed from shared table and badge primitives rather than stacked cards as the primary composition.

#### Scenario: Assay page uses shared primitives

- **WHEN** a user views an accepted assay’s detail page
- **THEN** specimen and regulatory status appear as shared badges, and the page is not a stack of cards

#### Scenario: Event page uses shared primitives

- **WHEN** a user views an accepted market event’s detail page
- **THEN** relevant tests appear in a shared table, not nested cards

#### Scenario: Note page uses shared primitives

- **WHEN** a user views an accepted CRM note’s detail page
- **THEN** channel appears as a shared badge, and sibling notes appear in a shared table

### Requirement: Shared data table on ranked worklists

The home ranked list SHALL use a shared data-table composition built from table, badge, and input primitives, with a search field and controls to sort columns and filter tumor focus, incumbent lab, and readiness.

#### Scenario: Home uses the data table

- **WHEN** a user opens `/`
- **THEN** the ranked list includes a search field and sort or filter controls, and rows still render in a shared table with incumbent as a shared badge
