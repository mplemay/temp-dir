# Design

## Context

See `proposal.md` for motivation. Requirements are in `specs/agent-skills/spec.md`.

Current state:

- `.agents/skills/` holds six committed OpenSpec skills (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`, `openspec-update-change`) plus `.openspec-target`. There is no `skills-lock.json` and no `skills` dependency.
- `package.json` already has `"prepare": "vp config"` for Vite+ hooks. There is no `postinstall`.
- This is a pnpm (Vite+) app. Direct packages that currently ship `SKILL.md` at top-level `node_modules` include `@tanstack/react-start` (`skills/react-start`) and `@tanstack/devtools-vite` (`skills/devtools-vite-plugin`). Additional TanStack and other skills exist only under `node_modules/.pnpm/...` (for example `router-core`, `start-core`) and are not visible to a top-level `node_modules` scan.
- shadcn and vite-plus do not ship `SKILL.md` in this install.

Constraints: keep Vite+ (`vp` scripts, `prepare: vp config`), keep OpenSpec skills, do not change app runtime.

## Goals / Non-Goals

**Goals:**

- Pin the official skills.sh CLI and run `experimental_sync` non-interactively after install.
- Commit the local lockfile so the synced set is reviewable.
- Leave OpenSpec skill folders untouched.

**Non-Goals:**

- Recursing into pnpm’s `.pnpm` store or enabling `shamefully-hoist` to expose transitive skills.
- Adding `skills-npm`, a Skillfile, or leaderboard skills from skills.sh that are not in this repo’s dependencies.
- Changing how OpenSpec skills are authored or installed.

## Decisions

### 1. Use the official skills.sh CLI and `experimental_sync`

Add the `skills` package (the CLI from [skills.sh](https://www.skills.sh) / vercel-labs/skills) as a **devDependency**, invoked from package scripts so the version is pinned.

Use `skills experimental_sync -y` to discover `SKILL.md` in top-level `node_modules` (package root, `skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`, including scoped packages) and install them project-scoped. `-y` skips agent and confirm prompts. Universal `.agents/skills/` is always a target; Cursor is included when detected.

Canonical copies land in `.agents/skills/`; Cursor links (`.cursor/skills/`) are created as the CLI’s agent-specific symlinks to that canonical location.

**Alternatives:**

- `npx skills` without a pin. Drifts across machines; experimental commands change.
- [antfu/skills-npm](https://github.com/antfu/skills-npm). Different tool; the request is the skills.sh experimental command.
- `skills add` per GitHub repo. Does not consume skills already sitting in installed packages.

### 2. Hook sync on `postinstall`; keep `prepare: vp config`

```json
"scripts": {
  "prepare": "vp config",
  "postinstall": "skills experimental_sync -y",
  "skills:sync": "skills experimental_sync -y"
}
```

`postinstall` matches the experimental_sync docs and runs after `vp install` / `pnpm install` without replacing Vite+ hook setup. `skills:sync` is the explicit re-run (including `--force` when someone needs a rebuild: `vp run skills:sync -- --force` is not assumed; document `pnpm run skills:sync` / `vp run skills:sync`).

**Alternatives:**

- Append to `prepare`. Mixes Vite+ config generation with skill sync; `prepare` also runs on publish/pack.
- Manual-only script. Misses the “after install” requirement.

### 3. Accept pnpm’s top-level scan; do not hoist the store

`experimental_sync` reads `node_modules/<pkg>` and `node_modules/@scope/<pkg>` only. Under pnpm, that is direct (and hoisted) dependencies, not everything in `.pnpm`. Nested catalog skills such as `skills/lifecycle/migrate-from-nextjs` are also deeper than the CLI’s one-level `skills/*/` walk, though files inside a discovered skill folder (for example `react-start/server-components`) come along with that folder.

Do **not** set `shamefully-hoist` or add extra TanStack packages solely to surface more skills. If a missing nested skill becomes important later, add that package as a direct dependency and re-sync.

**Alternatives:**

- `publicHoistPattern` / `shamefully-hoist`. Changes resolution for the whole app.
- Vendor copies of transitive skills. Drift from the installed package version.

### 4. Lockfile and git

Commit `skills-lock.json` at the repo root (project-scoped, hash-based, meant for version control). Do not gitignore `.agents/skills/`. After the first sync, commit newly added dependency skill folders alongside the lockfile.

OpenSpec skills stay as ordinary committed directories. They are not entries in the node_modules lock and MUST NOT be deleted by sync. Name collision is not expected (`openspec-*` vs TanStack skill names such as `react-start`).

**Alternatives:**

- Gitignore synced skill dirs and rely only on postinstall. Agents in a fresh clone before install would miss dependency skills; OpenSpec skills would still need to be committed, so the directory cannot be ignored wholesale.

## Risks / Trade-offs

- **[Risk] `experimental_sync` API is unstable** → Pin the `skills` CLI version; re-read `--help` if a future bump breaks flags.
- **[Risk] Postinstall fails and blocks `vp install`** → Sync only reads local `node_modules` and the pinned CLI; if the CLI errors, fix or temporarily run install with `--ignore-scripts` is an emergency escape, not the default.
- **[Risk] Transitive package skills never appear (pnpm + one-level scan)** → Documented limitation; add a direct dependency only when a specific skill is required.
- **[Risk] Sync overwrites a same-named local skill** → First sync should list discovered names and leave OpenSpec folders alone; do not use `--force` unless recovering a corrupted lock or deleted synced skill.
- **[Risk] Windows symlink fallback copies files** → Accept copies; hashes in the lockfile still detect updates.

## Migration Plan

1. Add the `skills` devDependency.
2. Add `postinstall` and `skills:sync` scripts; leave `prepare` as `vp config`.
3. Run `skills experimental_sync -y` once from the repo root.
4. Confirm OpenSpec skill folders still exist; confirm new dependency skills and `skills-lock.json`.
5. Commit the lockfile and new skill paths.

Rollback: remove the `skills` dependency and scripts, delete `skills-lock.json` and the synced dependency skill folders, leave OpenSpec skills in place.
