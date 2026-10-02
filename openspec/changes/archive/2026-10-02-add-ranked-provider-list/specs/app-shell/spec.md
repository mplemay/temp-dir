# Spec Delta

## MODIFIED Requirements

### Requirement: Home page

The application SHALL render a home page at `/` that shows the committed ranked provider list as the primary content, identifies Market Intelligence, Product Knowledge, and CRM as browseable feeds, and does not present the previous vanilla Vite starter landing page or its client-only counter. Ranked rows MUST NOT open a per-provider detail route.

#### Scenario: Successful home visit

- **WHEN** a user opens `/`
- **THEN** they see a ranked provider list and an overview of Market Intelligence, Product Knowledge, and CRM, with no Vite “Get started” copy and no “Count is” counter

#### Scenario: Ranked list is visible

- **WHEN** a user opens `/`
- **THEN** they see providers in rank order with name, organization, tumor focus, incumbent lab, opportunity patient count, and a why-now line

#### Scenario: Home content is in the initial HTML

- **WHEN** a client fetches `/` without executing client JavaScript
- **THEN** the response body includes the home page heading and at least one ranked provider name

#### Scenario: Overview opens a feed

- **WHEN** a user activates the Market Intelligence overview control
- **THEN** they navigate to the market intelligence page

#### Scenario: Ranked rows stay on home

- **WHEN** a user views the ranked list on `/`
- **THEN** the list does not link to a per-provider detail route
