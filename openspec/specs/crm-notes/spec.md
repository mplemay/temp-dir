# crm-notes Specification

## Purpose

Loads committed mock CRM interaction notes into typed records keyed by NPI, so later objection handling and meeting scripts can join relationship context instead of inventing it.

## Requirements

### Requirement: Committed notes fixture

The system SHALL load a committed notes CSV from a known repository path whenever CRM notes are requested.

#### Scenario: Successful load of committed notes

- **WHEN** the committed notes CSV is present and readable
- **THEN** the system returns a load result that includes accepted note records

#### Scenario: Missing fixture fails closed

- **WHEN** the committed notes CSV is missing
- **THEN** the system does not return a successful empty notes set and reports that the fixture could not be loaded

### Requirement: Note grain and fields

Each accepted note SHALL represent one prior interaction and SHALL include a 10-digit numeric `npi`, a `note_date` of `YYYY-MM-DD`, and a non-empty `body`. Distinct notes MAY share an NPI.

#### Scenario: Invalid NPI is rejected

- **WHEN** a row has a missing NPI, a non-numeric NPI, or an NPI that is not 10 digits
- **THEN** that row is not accepted and the skip reason names the NPI field

#### Scenario: Empty body is rejected

- **WHEN** a row has an empty `body`
- **THEN** that row is not accepted and the skip reason names the body field

#### Scenario: Two notes may share an NPI

- **WHEN** two valid rows share the same NPI and have different bodies
- **THEN** both rows are accepted

### Requirement: Schema validation with skip report

The system SHALL validate each notes row against the fixture schema. Invalid rows SHALL be omitted from the accepted set. The load result SHALL include the accepted count and, for each skipped row, a reason.

#### Scenario: Invalid date is skipped

- **WHEN** a row has a `note_date` that is not `YYYY-MM-DD`
- **THEN** that row is omitted and the report includes a skip reason for note date

#### Scenario: Valid rows survive mixed invalid input

- **WHEN** the notes CSV contains both valid rows and invalid rows
- **THEN** every valid row is present in the accepted set and every invalid row appears only in the skip report

### Requirement: Notes by NPI

The system SHALL return every accepted note whose `npi` equals a given 10-digit identifier. An NPI with no matching notes SHALL return an empty set.

#### Scenario: Known NPI returns its notes

- **WHEN** accepted notes include a row for NPI `1600000004`
- **THEN** lookup of `1600000004` returns that note and does not return notes for other NPIs

#### Scenario: Unknown NPI returns no notes

- **WHEN** no accepted note has NPI `1699999999`
- **THEN** lookup of `1699999999` returns an empty set

### Requirement: Coverage of reserved CRM NPIs

Every accepted provider with `reserved_for_crm` true in the committed market-intelligence fixture SHALL have at least one accepted note whose `npi` matches. Every accepted note in the committed CRM-notes fixture SHALL use an NPI that is reserved.

#### Scenario: Current reserved NPIs all have notes

- **WHEN** the committed CRM-notes and market-intelligence fixtures are loaded
- **THEN** each reserved provider NPI has at least one accepted note

#### Scenario: Invented NPI fails coverage

- **WHEN** a committed note uses an NPI that is not marked `reserved_for_crm`
- **THEN** the coverage check does not pass

### Requirement: Product metrics and volume stay out of this feed

The notes CSV MUST NOT contain columns for turnaround time, gene-panel size, companion-diagnostic accuracy, patient volume, or rank. Committed note bodies MUST NOT cite numeric assay performance claims.

#### Scenario: No TAT or volume columns on notes

- **WHEN** the committed notes CSV is inspected
- **THEN** it has no column for turnaround time, gene count, accuracy, estimated patient volume, or rank

#### Scenario: Bodies do not copy assay numbers

- **WHEN** a committed note body is accepted
- **THEN** it does not include a numeric turnaround-time, gene-count, or accuracy claim

### Requirement: Patient identifiers stay out of note bodies

Committed note bodies MUST be mock sales-interaction prose and MUST NOT include a patient name, medical record number, or date of birth.

#### Scenario: No MRN or DOB in committed bodies

- **WHEN** the committed notes fixture is loaded
- **THEN** no accepted body contains a medical record number, date of birth, or named patient identifier
