# Tasks

## 1. Pin the skills.sh CLI

- [x] 1.1 Add the official `skills` package as a `devDependency`, run `vp install`, and verify `pnpm exec skills --help` (or equivalent) lists `experimental_sync` without a global install
- [x] 1.2 Add `"postinstall": "skills experimental_sync -y"` and `"skills:sync": "skills experimental_sync -y"` while leaving `"prepare": "vp config"`, then verify those three script entries in `package.json`

## 2. Sync dependency skills

- [x] 2.1 Run `skills experimental_sync -y` from the repo root (or `vp run skills:sync`) and verify `skills-lock.json` exists at the root and lists at least the discoverable top-level package skills (expected today: `react-start` from `@tanstack/react-start` and `devtools-vite-plugin` from `@tanstack/devtools-vite`)
- [x] 2.2 Confirm `.agents/skills/` contains the synced skill folders with `SKILL.md` files, and verify each of the six OpenSpec skill folders still exists with its `SKILL.md` (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`, `openspec-update-change`)

## 3. Integration

- [x] 3.1 Invoke the project CLI (`pnpm exec skills list` or `skills ls`) and verify it reports both the OpenSpec skills and the newly synced dependency skills
- [x] 3.2 Run `vp check` and verify format, lint, and type-check still pass with the new lockfile and skill directories in the tree
