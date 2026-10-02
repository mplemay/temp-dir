# Spec Delta

## MODIFIED Requirements

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
- **THEN** table and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Browse pages import primitives

- **WHEN** a developer inspects a feed browse route
- **THEN** table, card, and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

#### Scenario: Brief page imports primitives

- **WHEN** a developer inspects the provider brief route
- **THEN** card and badge primitives are imported from the shared UI module path under `@/`, not inlined as custom markup in the route

## ADDED Requirements

### Requirement: Shared primitives on the provider brief page

The provider brief page SHALL be composed from shared card and badge primitives rather than one-off styled sections.

#### Scenario: Brief uses cards

- **WHEN** a user views a ranked provider’s brief page
- **THEN** overview, meeting script, and (when present) objection content appear in shared cards
