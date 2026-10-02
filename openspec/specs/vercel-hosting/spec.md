# vercel-hosting Specification

## Purpose

Hosts this app on Vercel so production requests are server-rendered and server functions can still read the committed fixture files.

## Requirements

### Requirement: Production requests hit the server

A Vercel production deployment of this repository SHALL answer document routes with the app server. It MUST NOT publish the site as a static client bundle that returns a platform 404 for server routes.

#### Scenario: Home document is server-rendered

- **WHEN** a client requests `/` on the production deployment without executing JavaScript
- **THEN** the response is HTML that includes the home page heading and at least one ranked provider name

#### Scenario: Provider brief route resolves

- **WHEN** a client requests the brief route for an NPI that exists in the committed ranked list
- **THEN** the response is that provider’s brief page and not a platform 404

### Requirement: Deployed server functions read committed fixtures

Server functions on the production deployment SHALL load the committed ranked-provider, provider-brief, market-intelligence, product-knowledge, and CRM-notes fixtures. A successful response MUST NOT be a missing-fixture error for those committed files.

#### Scenario: Ranked list loads in production

- **WHEN** the production home page loads its ranked providers
- **THEN** the response includes providers from the committed ranked artifact

#### Scenario: Assay catalog loads in production

- **WHEN** the production product-knowledge page loads its catalog
- **THEN** the response includes assays from the committed markdown fixtures

#### Scenario: Missing fixture still fails closed

- **WHEN** a requested fixture file is absent from the deployed server
- **THEN** the system does not return a successful empty result and reports that the fixture could not be loaded

### Requirement: Install uses the pinned package manager

The repository SHALL declare pnpm `12.8.1` as its package manager so a Vercel install uses that version. The install MUST succeed with the committed lockfile and `catalog:` specifiers.

#### Scenario: Vercel install selects pnpm 12.8.1

- **WHEN** Vercel installs dependencies for a deployment of this repository
- **THEN** the install uses pnpm `12.8.1` and completes without a lockfile or catalog error

### Requirement: Pages render without runtime secrets

The production deployment SHALL render the ranked list, provider briefs, and browse pages without an OpenAI key or any other runtime secret.

#### Scenario: Home renders with no secrets configured

- **WHEN** the production deployment has no application environment variables set
- **THEN** `/` still returns the ranked provider list
