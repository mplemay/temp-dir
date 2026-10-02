# product-knowledge Specification

## Purpose

Loads committed Tempus assay markdown into typed records with public performance claims, provenance, and aliases, so later objection handling and meeting scripts can join event test tokens to citable facts instead of inventing metrics.

## Requirements

### Requirement: Committed assay fixtures

The system SHALL load committed markdown assay files from a known repository path whenever product knowledge is requested.

#### Scenario: Successful load of committed assays

- **WHEN** the committed assay directory is present and contains readable markdown files
- **THEN** the system returns a load result that includes accepted assay records

#### Scenario: Missing fixture fails closed

- **WHEN** the committed assay directory is missing
- **THEN** the system does not return a successful empty catalog and reports that the fixture could not be loaded

### Requirement: Assay grain and identity

Each accepted assay SHALL represent one orderable test or named add-on and SHALL include a `test_id` that uniquely identifies that assay in the loaded set.

#### Scenario: Duplicate test id is skipped

- **WHEN** two markdown files share the same `test_id`
- **THEN** at most one of those files is accepted and the duplicate is reported as skipped

#### Scenario: Missing test id is rejected

- **WHEN** a markdown file has no `test_id` in front matter
- **THEN** that file is not accepted and the skip reason names the `test_id` field

### Requirement: Alias join keys

Each accepted assay SHALL include a display name and a non-empty list of aliases. Alias lookup SHALL return every accepted assay whose aliases contain the exact token. Distinct assays MAY share an alias.

#### Scenario: Shared liquid-biopsy token resolves to both assays

- **WHEN** accepted assays include aliases `xF` and `xF+` and both also list `xF/xF+`
- **THEN** lookup of `xF/xF+` returns both assays and lookup of `xF` returns only the xF assay

#### Scenario: Unknown token returns no assays

- **WHEN** no accepted assay lists the token `nP` as an alias
- **THEN** lookup of `nP` returns an empty set

### Requirement: Schema validation with skip report

The system SHALL validate each markdown file against the assay schema. Invalid files SHALL be omitted from the accepted set. The load result SHALL include the accepted count and, for each skipped file, a reason.

#### Scenario: Invalid regulatory status is skipped

- **WHEN** a file has a `regulatory_status` outside the allow-list
- **THEN** that file is omitted and the report includes a skip reason for regulatory status

#### Scenario: Valid files survive mixed invalid input

- **WHEN** the directory contains both valid markdown files and invalid markdown files
- **THEN** every valid file is present in the accepted set and every invalid file appears only in the skip report

### Requirement: Public performance claims

Each accepted assay SHALL include `specimen` from the allow-list, `regulatory_status` from the allow-list, `gene_count`, `tat_days`, and `tat_qualifier`. `gene_count` and `tat_days` MAY be null when unpublished. The system MUST NOT invent a numeric TAT or gene count that is absent from the fixture.

#### Scenario: Unpublished TAT is accepted as null

- **WHEN** a valid assay file omits a numeric turnaround time
- **THEN** the accepted record has `tat_days` of null and is not assigned a guessed number of days

#### Scenario: Published TAT is preserved

- **WHEN** a valid assay file has `tat_days` of 6
- **THEN** the accepted record has `tat_days` of 6

#### Scenario: Negative gene count is skipped

- **WHEN** a file has a `gene_count` less than 0
- **THEN** that file is omitted from the accepted set

### Requirement: Provenance

Each accepted assay SHALL include a `source_url` on `tempus.com` and a `retrieved_on` date.

#### Scenario: Missing source url is skipped

- **WHEN** a file has no `source_url`
- **THEN** that file is not accepted and the skip reason names the `source_url` field

#### Scenario: Non-Tempus host is skipped

- **WHEN** a file has a `source_url` whose host is not `tempus.com`
- **THEN** that file is omitted from the accepted set

### Requirement: Markdown body for later briefs

Each accepted assay SHALL include a non-empty markdown body after the front matter.

#### Scenario: Empty body is skipped

- **WHEN** a file has valid front matter and an empty body
- **THEN** that file is omitted from the accepted set

#### Scenario: Body is preserved

- **WHEN** a valid assay file has a non-empty markdown body
- **THEN** the accepted record includes that body text

### Requirement: Coverage of territory event tokens

Every semicolon-delimited token in `relevant_tests` on the committed market-intelligence events fixture SHALL resolve to at least one accepted assay via alias lookup.

#### Scenario: Current event tokens all resolve

- **WHEN** the committed product-knowledge and market-intelligence fixtures are loaded
- **THEN** each trimmed token from every event's `relevant_tests` field matches at least one accepted assay alias

#### Scenario: Uncovered token fails coverage

- **WHEN** a committed event `relevant_tests` token has no matching assay alias
- **THEN** the coverage check does not pass

### Requirement: Commercial and CRM content stays out of this feed

Assay front matter MUST NOT include provider identity, patient-volume estimates, incumbent-lab fields, or CRM notes.

#### Scenario: No NPI or volume fields on assays

- **WHEN** accepted assay front matter is inspected
- **THEN** it has no fields for NPI, estimated patient volume, incumbent lab, or CRM notes

#### Scenario: Catalog is not the full Tempus portfolio

- **WHEN** the committed fixture is loaded
- **THEN** accepted assays include the event-token assays and do not require germline, imaging, or data-licensing products
