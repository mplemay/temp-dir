# Spec Delta

## Purpose

Produces offline, NPI-keyed copilot briefs from committed feeds and the ranked list so a per-provider page can show an overview, a grounded objection handler, and a 30-second meeting script without calling a model at request time.

## ADDED Requirements

### Requirement: Committed briefs artifact

The system SHALL load a committed provider-briefs JSON file from a known repository path whenever a brief is requested.

#### Scenario: Successful load of the artifact

- **WHEN** the committed briefs file is present and readable
- **THEN** the system returns a load result that includes one brief record per ranked provider NPI

#### Scenario: Missing artifact fails closed

- **WHEN** the committed briefs file is missing
- **THEN** the system does not return a successful empty briefs set and reports that the artifact could not be loaded

### Requirement: Full ranked coverage

The briefs artifact SHALL contain exactly one record for each ranked provider, keyed by that provider’s 10-digit NPI. Providers with no CRM notes SHALL still have a brief.

#### Scenario: Every ranked provider has a brief

- **WHEN** the committed briefs artifact and ranked-providers artifact are loaded
- **THEN** the brief NPIs are exactly the ranked NPIs with no duplicates and no extras

#### Scenario: Providers without notes still have a brief

- **WHEN** a ranked provider has no CRM notes
- **THEN** that provider is present in the briefs artifact

### Requirement: Meeting script for every provider

Each brief SHALL include a non-empty `meeting_script` of at most 30 seconds of spoken copy, tailored to that provider’s tumor focus, incumbent, why-now line, and extracted interest when present.

#### Scenario: Every brief has a meeting script

- **WHEN** the committed briefs artifact is loaded
- **THEN** every brief record has a non-empty `meeting_script` string

#### Scenario: Script uses extracted interest when present

- **WHEN** a ranked provider has a non-empty extracted `interest`
- **THEN** that provider’s `meeting_script` is grounded in that interest and does not contradict it

### Requirement: Objection handler for known concerns

Each brief SHALL include `objection_response` text. When the ranked record’s `concern` is non-empty, `objection_response` SHALL be a non-empty drafted reply that uses published assay metrics from the joined packet. When `concern` is empty, `objection_response` SHALL be empty. The system MUST NOT invent a concern.

#### Scenario: Known concern produces a drafted response

- **WHEN** a ranked provider has a non-empty `concern`
- **THEN** that brief’s `objection_response` is non-empty

#### Scenario: No concern means no invented objection

- **WHEN** a ranked provider has an empty `concern`
- **THEN** that brief’s `objection_response` is empty

#### Scenario: Turnaround concern cites published TAT

- **WHEN** a brief is generated for NPI `1600000004` and the joined packet includes a numeric assay turnaround time
- **THEN** that brief’s `objection_response` addresses turnaround time using a TAT number present in the packet

### Requirement: Grounded generated copy

`objection_response` and `meeting_script` MUST be grounded in the joined provider fields, ranked signals, matched events, and assay claims in the packet. They MUST NOT invent a numeric turnaround time, gene count, or accuracy claim that is absent from the packet.

#### Scenario: Unpublished assay numbers are not invented in the objection

- **WHEN** the joined packet has no numeric turnaround time
- **THEN** that brief’s `objection_response` does not include a numeric turnaround-time claim

#### Scenario: Unpublished assay numbers are not invented in the script

- **WHEN** the joined packet has no numeric gene count
- **THEN** that brief’s `meeting_script` does not include a numeric gene-count claim

### Requirement: Runtime does not call OpenAI

Loading and serving briefs MUST NOT call the OpenAI API and MUST NOT require `OPENAI_API_KEY`.

#### Scenario: Load succeeds without an API key

- **WHEN** `OPENAI_API_KEY` is unset and the committed briefs artifact is present
- **THEN** briefs still load

### Requirement: Generate metadata records the model

The committed briefs artifact SHALL record that it was produced with model `gpt-6-luna` and reasoning effort `medium`.

#### Scenario: Artifact names the model

- **WHEN** the committed briefs artifact is loaded
- **THEN** its metadata includes `model` of `gpt-6-luna` and `reasoning_effort` of `medium`

### Requirement: Brief fields stay out of other stores

The briefs pipeline MUST NOT write `meeting_script` or `objection_response` onto the market-intelligence, product-knowledge, CRM-notes, or ranked-providers source files.

#### Scenario: Ranked artifact is unchanged as a brief store

- **WHEN** the briefs artifact exists
- **THEN** the committed ranked-providers JSON still has no `meeting_script` or `objection_response` field
