# Proposal

## Why

This repo already ships OpenSpec skills under `.agents/skills/`, but it does not use the skills.sh CLI (`npx skills`) or pick up `SKILL.md` files bundled in npm packages. TanStack Start and related packages already include those files, so agents working in this project miss the library skills that come with the stack.

## What Changes

- Configure the [skills.sh](https://www.skills.sh) CLI as a project-scoped tool (pinned dependency, scripts, and lockfile).
- Sync skills discovered in installed dependencies into agent skill directories using `skills experimental_sync`.
- Keep existing OpenSpec skills in `.agents/skills/` as first-class local skills, not managed by the node_modules lock.
- Record synced dependency skills in committed `skills-lock.json` so clones restore the same set after install.

## Capabilities

### New Capabilities

- `agent-skills`: Project-scoped agent skills via skills.sh — CLI setup, sync from npm dependencies, lockfile, and coexistence with local OpenSpec skills.

### Modified Capabilities

- None. `app-shell` and `design-system` are unchanged.

## Impact

- **Dependencies**: Add the official `skills` CLI as a devDependency.
- **Scripts**: Add a non-interactive sync script and run it after package install without replacing `prepare: vp config`.
- **Repo files**: Add `skills-lock.json`; add synced skill folders under `.agents/skills/` (and Cursor agent links if the CLI creates them). OpenSpec skill folders stay.
- **Runtime**: No application runtime, route, or UI change.
- **Out of scope**: Installing arbitrary skills.sh leaderboard skills, publishing this repo’s skills, switching to `skills-npm`, or hoisting the entire pnpm store so nested transitive packages become scan targets.
