# Spec Delta

## MODIFIED Requirements

### Requirement: Component source of truth

Shared UI primitives SHALL live in the project as source files that routes import through a stable `@/` alias, so new screens reuse the same components.

#### Scenario: Route imports primitives

- **WHEN** a developer adds or inspects the home route
- **THEN** the overview cards are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Browse pages import primitives

- **WHEN** a developer inspects a feed browse route
- **THEN** table, card, and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

## ADDED Requirements

### Requirement: Shared UI primitives on the overview home

The home page SHALL be composed from shared UI primitives, including a card with header, title, description, and content for each of the three feeds.

#### Scenario: Home cards

- **WHEN** a user opens `/`
- **THEN** they see three cards titled for Market Intelligence, Product Knowledge, and CRM, each with a short description

#### Scenario: Cards navigate

- **WHEN** a user activates the Market Intelligence home card
- **THEN** they navigate to the market intelligence page

### Requirement: Shared sidebar chrome

The application chrome SHALL be composed from the shared sidebar primitive, with navigation items and a main content inset, not custom nav markup.

#### Scenario: Sidebar primitive on a feed page

- **WHEN** a user views the market intelligence page
- **THEN** the navigation is the shared sidebar, and the page content sits in the main inset beside it

### Requirement: Shared primitives on browse pages

Feed browse pages SHALL be composed from shared card, table, and badge primitives rather than one-off styled lists.

#### Scenario: Market intelligence table

- **WHEN** a user views the market intelligence page
- **THEN** providers appear in a shared table, and incumbent lab is shown with a shared badge

#### Scenario: Product knowledge cards

- **WHEN** a user views the product knowledge page
- **THEN** each assay appears in a shared card with specimen and regulatory status as shared badges

#### Scenario: CRM note cards

- **WHEN** a user views the CRM page
- **THEN** each note appears in a shared card

## REMOVED Requirements

### Requirement: Shared UI primitives on the home page

**Reason**: The starter home card and dummy Continue button are replaced by a three-card feed overview that navigates.

**Migration**: Use requirement “Shared UI primitives on the overview home”.
