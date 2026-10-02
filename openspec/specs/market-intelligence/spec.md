# market-intelligence Specification

## Purpose

Loads a committed oncology territory file into typed provider records with estimated patient populations, incumbent-lab context, and tumor-typed market events, so later ranking and briefs can join on NPI instead of inventing the universe at prompt time.

## Requirements

### Requirement: Committed territory fixtures

The system SHALL load a committed provider CSV and a committed market-events CSV from a known repository path whenever market intelligence is requested.

#### Scenario: Successful load of both fixtures

- **WHEN** both committed CSV files are present and readable
- **THEN** the system returns a load result that includes provider records and market-event records

#### Scenario: Missing fixture fails closed

- **WHEN** either committed CSV file is missing
- **THEN** the system does not return a successful empty territory and reports that the fixture could not be loaded

### Requirement: Provider grain and NPI identity

Each accepted provider record SHALL represent one ordering clinician and SHALL include a 10-digit numeric NPI that uniquely identifies that clinician in the loaded set.

#### Scenario: One clinician per NPI

- **WHEN** the provider CSV contains two rows with the same NPI
- **THEN** at most one of those rows is accepted and the duplicate is reported as skipped

#### Scenario: Invalid NPI is rejected

- **WHEN** a row has a missing NPI, a non-numeric NPI, or an NPI that is not 10 digits
- **THEN** that row is not accepted and the skip reason names the NPI field

### Requirement: Schema validation with skip report

The system SHALL validate each provider and market-event row against the fixture schema. Invalid rows SHALL be omitted from the accepted set. The load result SHALL include the accepted counts and, for each skipped row, a reason.

#### Scenario: Invalid specialty is skipped

- **WHEN** a provider row has a specialty outside the allow-list
- **THEN** that row is omitted and the report includes a skip reason for specialty

#### Scenario: Out-of-range rate is skipped

- **WHEN** a provider row has `est_ngs_testing_rate` outside 0 through 1
- **THEN** that row is omitted and remaining valid rows are still accepted

#### Scenario: Valid rows survive mixed invalid input

- **WHEN** the provider CSV contains both valid rows and invalid rows
- **THEN** every valid row is present in the accepted set and every invalid row appears only in the skip report

### Requirement: Labeled patient population estimates

Each accepted provider record SHALL include estimated annual new cancer patients, estimated annual advanced solid-tumor patients, an NGS testing-rate estimate between 0 and 1 inclusive, a volume basis, and a volume confidence of `high`, `medium`, or `low`.

#### Scenario: Estimate fields are present

- **WHEN** a valid provider row is accepted
- **THEN** the record includes `est_new_cancer_patients_annual`, `est_advanced_solid_tumor_annual`, `est_ngs_testing_rate`, `volume_basis`, and `volume_confidence`

#### Scenario: Unknown confidence is rejected

- **WHEN** a provider row has a `volume_confidence` other than `high`, `medium`, or `low`
- **THEN** that row is omitted from the accepted set

### Requirement: Account and commercial overlay

Each accepted provider record SHALL include organization name, organization type from the allow-list, health system, city, state, specialty, primary tumor focus, incumbent lab from the allow-list, and trailing-12-month Tempus order count (zero allowed).

#### Scenario: Community and academic org types load

- **WHEN** the fixture includes at least one `academic` or `nci_designated` row and at least one `community_hospital` or `independent_practice` row
- **THEN** accepted records retain those organization types

#### Scenario: Unknown incumbent is allowed

- **WHEN** a valid provider row has `incumbent_lab` of `unknown`
- **THEN** the row is accepted and the record preserves `unknown`

#### Scenario: Disallowed incumbent is skipped

- **WHEN** a provider row has an incumbent lab outside `Tempus`, `FMI`, `Caris`, `Guardant`, `in_house`, and `unknown`
- **THEN** that row is omitted from the accepted set

### Requirement: Derived opportunity features

The system SHALL attach `tempus_share` and `opportunity_patients` to each accepted provider. Those values MUST be computed from accepted fields after load and MUST NOT be taken from precomputed rank or impact columns in the CSV.

#### Scenario: Share is computed from orders and eligible volume

- **WHEN** an accepted provider has 40 trailing-12-month Tempus orders and 200 estimated advanced solid-tumor patients
- **THEN** `tempus_share` is 0.2 and `opportunity_patients` is 160

#### Scenario: Zero eligible volume

- **WHEN** an accepted provider has 0 estimated advanced solid-tumor patients
- **THEN** `tempus_share` is 0 and `opportunity_patients` is 0

#### Scenario: CSV rank column is ignored

- **WHEN** the provider CSV includes a `rank` or `impact_score` column
- **THEN** accepted records do not use that column as `tempus_share` or `opportunity_patients`

### Requirement: Tumor-typed market events

Each accepted market-event record SHALL include a tumor type, event date, headline, relevant Tempus tests, and a why-now note. For each accepted provider, the system SHALL expose the events whose tumor type equals that provider's primary tumor focus. Providers whose primary tumor focus is `mixed` SHALL receive every accepted event.

#### Scenario: NSCLC provider gets NSCLC events only

- **WHEN** an accepted provider has primary tumor focus `NSCLC` and events exist for `NSCLC` and `CRC`
- **THEN** that provider's matched events include the NSCLC event and do not include the CRC event

#### Scenario: Mixed-focus provider gets all events

- **WHEN** an accepted provider has primary tumor focus `mixed` and at least two events with different tumor types are accepted
- **THEN** that provider's matched events include every accepted event

### Requirement: Territory composition

The accepted provider set from the committed fixture SHALL contain at least 40 and at most 80 clinicians, SHALL include both academic-or-NCI and community-or-independent organization types, and SHALL mark at least 8 distinct NPIs as reserved CRM join keys.

#### Scenario: Fixture is large enough to rank later

- **WHEN** the committed provider CSV is loaded with no injected invalid rows
- **THEN** the accepted set contains between 40 and 80 providers

#### Scenario: CRM join keys are reserved

- **WHEN** the committed fixture is loaded
- **THEN** at least 8 accepted providers have `reserved_for_crm` true and those NPIs are unique

### Requirement: Product performance claims stay out of this feed

The provider CSV and market-events CSV MUST NOT contain test performance metrics such as turnaround time, gene-panel size, or companion-diagnostic accuracy claims.

#### Scenario: No TAT column on providers

- **WHEN** the committed provider CSV is inspected
- **THEN** it has no column for turnaround time, gene count, or CDx accuracy

#### Scenario: Events describe why now, not assay specs

- **WHEN** a market-event row is accepted
- **THEN** its fields identify tumor type, date, headline, relevant tests, and why-now text without assay performance numbers
