# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Shared data table on ranked worklists

The home ranked list SHALL use a shared data-table composition built from table, badge, and input primitives, with a search field and controls to sort columns and filter tumor focus, incumbent lab, and readiness.

#### Scenario: Home uses the data table

- **WHEN** a user opens `/`
- **THEN** the ranked list includes a search field and sort or filter controls, and rows still render in a shared table with incumbent as a shared badge
