# Spec Delta

## MODIFIED Requirements

### Requirement: Home page

The application SHALL render a home page at `/` that identifies Market Intelligence, Product Knowledge, and CRM as browseable feeds and does not present the previous vanilla Vite starter landing page or its client-only counter.

#### Scenario: Successful home visit

- **WHEN** a user opens `/`
- **THEN** they see an overview of Market Intelligence, Product Knowledge, and CRM, with no Vite “Get started” copy and no “Count is” counter

#### Scenario: Home content is in the initial HTML

- **WHEN** a client fetches `/` without executing client JavaScript
- **THEN** the response body includes the home page heading or equivalent visible copy

#### Scenario: Overview opens a feed

- **WHEN** a user activates the Market Intelligence overview control
- **THEN** they navigate to the market intelligence page

## ADDED Requirements

### Requirement: Persistent sidebar navigation

The application SHALL show a sidebar on every page with links to Home, Market Intelligence, Product Knowledge, and CRM. The current page SHALL be visually distinguished in that navigation.

#### Scenario: Sidebar on home

- **WHEN** a user opens `/`
- **THEN** they see sidebar links for Home, Market Intelligence, Product Knowledge, and CRM

#### Scenario: Navigate from the sidebar

- **WHEN** a user activates the Product Knowledge sidebar link
- **THEN** they are taken to the product knowledge page

#### Scenario: Current page is marked

- **WHEN** a user is on the CRM page
- **THEN** the CRM sidebar item is marked as the current page

### Requirement: Market intelligence browse page

The application SHALL render a market intelligence page that lists accepted providers and accepted market events from the committed feed. The page MUST NOT rank providers or open a per-provider detail route.

#### Scenario: Providers are listed

- **WHEN** a user opens the market intelligence page
- **THEN** they see each accepted provider’s name, organization, tumor focus, incumbent lab, and opportunity patient count

#### Scenario: Events are listed

- **WHEN** a user opens the market intelligence page
- **THEN** they see each accepted market event’s headline and tumor type

### Requirement: Product knowledge browse page

The application SHALL render a product knowledge page that lists accepted assays from the committed feed. The page MUST NOT invent a numeric turnaround time or gene count that the feed left unpublished.

#### Scenario: Assays are listed

- **WHEN** a user opens the product knowledge page
- **THEN** they see each accepted assay’s display name, specimen, and regulatory status

#### Scenario: Unpublished metrics stay blank

- **WHEN** an accepted assay has a null turnaround time
- **THEN** the page does not show a numeric TAT for that assay

### Requirement: CRM browse page

The application SHALL render a CRM page that lists accepted notes from the committed feed. Each note SHALL show its date, body, and the matching clinician name when that NPI is present in market intelligence.

#### Scenario: Notes are listed

- **WHEN** a user opens the CRM page
- **THEN** they see each accepted note’s date and body

#### Scenario: Clinician name is shown

- **WHEN** a note’s NPI matches an accepted provider
- **THEN** that note is shown with the provider’s full name

### Requirement: Not-found stays in the app shell

When a path does not match a defined route, the not-found message SHALL appear inside the same document shell and sidebar as defined pages.

#### Scenario: Missing page still has navigation

- **WHEN** a user opens a path with no matching route
- **THEN** they see a not-found message and can still use the sidebar to reach Home
