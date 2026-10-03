# Spec Delta

## ADDED Requirements

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

#### Scenario: Feed detail pages import primitives

- **WHEN** a developer inspects an assay, market-event, or CRM-note detail route
- **THEN** table and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route
