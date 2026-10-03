# Spec Delta

## ADDED Requirements

### Requirement: Note by id

The system SHALL return the accepted note whose `note_id` equals a given identifier. An unknown `note_id` SHALL return no note.

#### Scenario: Known note id returns that note

- **WHEN** accepted notes include a row with `note_id` `quinn-chen-tat`
- **THEN** lookup of `quinn-chen-tat` returns that note and does not return notes with a different `note_id`

#### Scenario: Unknown note id returns no note

- **WHEN** no accepted note has `note_id` `missing-note`
- **THEN** lookup of `missing-note` returns no note

## MODIFIED Requirements

### Requirement: Note grain and fields

Each accepted note SHALL represent one prior interaction and SHALL include a unique `note_id`, a 10-digit numeric `npi`, a `note_date` of `YYYY-MM-DD`, a `channel` of `call`, `in_person`, or `email`, and a non-empty `body`. Distinct notes MAY share an NPI.

#### Scenario: Invalid NPI is rejected

- **WHEN** a row has a missing NPI, a non-numeric NPI, or an NPI that is not 10 digits
- **THEN** that row is not accepted and the skip reason names the NPI field

#### Scenario: Empty body is rejected

- **WHEN** a row has an empty `body`
- **THEN** that row is not accepted and the skip reason names the body field

#### Scenario: Two notes may share an NPI

- **WHEN** two valid rows share the same NPI and have different `note_id` values and different bodies
- **THEN** both rows are accepted

#### Scenario: Missing note id is rejected

- **WHEN** a row has no `note_id`
- **THEN** that row is not accepted and the skip reason names the `note_id` field

#### Scenario: Duplicate note id is skipped

- **WHEN** two rows share the same `note_id`
- **THEN** at most one of those rows is accepted and the duplicate is reported as skipped

#### Scenario: Invalid channel is skipped

- **WHEN** a row has a `channel` outside `call`, `in_person`, and `email`
- **THEN** that row is omitted and the report includes a skip reason for channel

### Requirement: Coverage of reserved CRM NPIs

Every accepted provider with `reserved_for_crm` true in the committed market-intelligence fixture SHALL have at least two accepted notes whose `npi` matches. Every accepted note in the committed CRM-notes fixture SHALL use an NPI that is reserved.

#### Scenario: Current reserved NPIs all have notes

- **WHEN** the committed CRM-notes and market-intelligence fixtures are loaded
- **THEN** each reserved provider NPI has at least two accepted notes

#### Scenario: Invented NPI fails coverage

- **WHEN** a committed note uses an NPI that is not marked `reserved_for_crm`
- **THEN** the coverage check does not pass
