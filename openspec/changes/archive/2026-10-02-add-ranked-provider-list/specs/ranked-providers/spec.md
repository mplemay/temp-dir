# Spec Delta

## Purpose

Produces an offline ranked call list from committed market intelligence, CRM notes, and product knowledge so the home page can show who to call, ordered by mix impact, without calling a model at request time.

## ADDED Requirements

### Requirement: Committed ranked artifact

The system SHALL load a committed ranked-providers JSON file from a known repository path whenever the ranked list is requested.

#### Scenario: Successful load of the artifact

- **WHEN** the committed ranked-providers file is present and readable
- **THEN** the system returns a load result that includes ranked provider records in rank order

#### Scenario: Missing artifact fails closed

- **WHEN** the committed ranked-providers file is missing
- **THEN** the system does not return a successful empty list and reports that the artifact could not be loaded

### Requirement: Full territory coverage

The ranked list SHALL contain exactly one record for each accepted market-intelligence provider, keyed by that provider’s 10-digit NPI. Ranks SHALL be the unique integers 1 through N in ascending order. Providers with no CRM notes SHALL still appear.

#### Scenario: Every accepted provider is ranked

- **WHEN** the committed ranked artifact and market-intelligence fixture are loaded
- **THEN** the ranked NPIs are exactly the accepted provider NPIs and ranks are 1 through the accepted provider count with no duplicates

#### Scenario: Providers without notes still appear

- **WHEN** an accepted provider has no CRM notes
- **THEN** that provider is present in the ranked list

### Requirement: Mix impact score

Each ranked record SHALL include a numeric `impact_score` computed from labeled feed fields after load. Volume (`opportunity_patients`) SHALL be the backbone. The score MUST apply an undertest factor from `est_ngs_testing_rate`, an incumbent weight, a matched-event boost, and a CRM-readiness multiplier. Assay turnaround time and gene count MUST NOT be inputs to the score.

#### Scenario: Score uses derived opportunity, not a CSV rank column

- **WHEN** a ranked record is produced for an accepted provider
- **THEN** its `impact_score` is computed from opportunity patients, NGS testing rate, incumbent lab, matched events, and CRM readiness, and not from a `rank` or `impact_score` column on the provider CSV

#### Scenario: Assay performance stays out of the score

- **WHEN** a ranked record is produced
- **THEN** `impact_score` does not change if assay `tat_days` or `gene_count` would have differed

#### Scenario: Retain accounts rank below a why-now switch

- **WHEN** one provider has high opportunity, incumbent Tempus, and readiness `retain`, and another has lower opportunity, a competitor incumbent, a matched event, and readiness `switch`
- **THEN** the switch provider’s `impact_score` is higher

### Requirement: CRM readiness extraction

Each ranked record SHALL include `readiness` of `switch`, `expand`, `retain`, or `unknown`, plus `concern` and `interest` text. When the provider has CRM notes, those fields SHALL come from extracting the note bodies. When the provider has no notes, `readiness` SHALL be `unknown`.

#### Scenario: Notes produce structured signals

- **WHEN** a provider has at least one accepted CRM note
- **THEN** that ranked record’s `readiness` is one of `switch`, `expand`, or `retain`, and `concern` and `interest` are non-empty

#### Scenario: No notes means unknown readiness

- **WHEN** a provider has no accepted CRM notes
- **THEN** that ranked record’s `readiness` is `unknown`

### Requirement: Grounded why-now line

Each ranked record SHALL include a non-empty `why_now` explanation. The explanation MUST be grounded in the joined provider fields, matched events, extracted CRM signals, and optional assay display names. It MUST NOT invent a numeric turnaround time, gene count, or accuracy claim that is absent from the joined packet.

#### Scenario: Every ranked row has why-now copy

- **WHEN** the committed ranked artifact is loaded
- **THEN** every ranked record has a non-empty `why_now` string

#### Scenario: Unpublished assay numbers are not invented

- **WHEN** the joined packet has no numeric turnaround time
- **THEN** that record’s `why_now` does not include a numeric turnaround-time claim

### Requirement: Runtime does not call OpenAI

Loading and serving the ranked list MUST NOT call the OpenAI API and MUST NOT require `OPENAI_API_KEY`.

#### Scenario: Load succeeds without an API key

- **WHEN** `OPENAI_API_KEY` is unset and the committed ranked artifact is present
- **THEN** the ranked list still loads

### Requirement: Generate metadata records the model

The committed ranked artifact SHALL record that it was produced with model `gpt-6-luna` and reasoning effort `medium`.

#### Scenario: Artifact names the model

- **WHEN** the committed ranked artifact is loaded
- **THEN** its metadata includes `model` of `gpt-6-luna` and `reasoning_effort` of `medium`

### Requirement: Ranking fields stay out of source feeds

The ranking pipeline MUST NOT write `rank`, `impact_score`, `readiness`, or `why_now` onto the market-intelligence, product-knowledge, or CRM-notes source files.

#### Scenario: Provider CSV is unchanged as a ranking store

- **WHEN** the ranked artifact exists
- **THEN** the committed provider CSV still has no `rank` or `impact_score` column used as the served rank
