# Spec Delta

## Purpose

Gives this repository a project-scoped skills.sh setup so agents load both local OpenSpec skills and skills bundled in installed npm packages.

## ADDED Requirements

### Requirement: Project-scoped skills CLI

The project SHALL provide the skills.sh CLI as a project-local tool so contributors can run the same skills commands from the repository without a global install.

#### Scenario: CLI runs from the repo

- **WHEN** a contributor invokes the project's skills CLI from the repository root
- **THEN** the command runs using the project's pinned CLI and does not require a separately installed global `skills` binary

### Requirement: Dependency skills sync after install

After package installation, the project SHALL copy or link `SKILL.md` skills discovered in installed npm packages into the project's agent skill directories, without interactive prompts.

#### Scenario: Fresh install picks up bundled skills

- **WHEN** a developer installs dependencies in a clone whose packages contain discoverable `SKILL.md` files
- **THEN** those discovered skills are present under the project's agent skills location

#### Scenario: Sync does not prompt

- **WHEN** dependency skill sync runs as part of install
- **THEN** it completes without asking which agents to use or whether to proceed

### Requirement: Local OpenSpec skills remain

OpenSpec skills already stored in the project SHALL remain present and loadable after dependency skill sync.

#### Scenario: OpenSpec skills still present after sync

- **WHEN** dependency skills are synced into the shared agent skills location
- **THEN** the existing OpenSpec skill folders are still there and still contain their `SKILL.md` files

### Requirement: Synced skills are locked

The project SHALL keep a committed lockfile at the repository root that records which dependency skills were synced.

#### Scenario: Lockfile written after sync

- **WHEN** dependency skill sync completes successfully
- **THEN** a lockfile at the repository root lists the synced dependency skills

#### Scenario: Teammate restore

- **WHEN** a teammate pulls the lockfile and installs dependencies
- **THEN** the same dependency skills are present in the agent skills location, matching current installed package contents
