# Design

## Context

See `proposal.md` for motivation. The repo is a Vite+ vanilla TypeScript SPA: `index.html` mounts `#app`, `src/main.ts` injects markup, `src/counter.ts` is client-only. Toolchain is Vite+ (`defineConfig` from `vite-plus`, `vp` scripts, pnpm catalog pinning `vite` to `@voidzero-dev/vite-plus-core`). There are no existing OpenSpec specs.

Behavior to satisfy is in `specs/app-shell/spec.md` and `specs/design-system/spec.md`.

Constraints that shape the approach:

- Do not drop Vite+ (`vp check`, oxlint, oxfmt, staged hooks, catalog pin).
- Do not create a nested app directory or monorepo.
- TanStack Start’s Vite plugin must run **before** `@vitejs/plugin-react`.
- Heavy plugins must be wrapped in Vite+ `lazyPlugins` so `vp lint` / `vp fmt` / `vp check` do not load Start on every config read.
- TanStack Start warns that `verbatimModuleSyntax` can leak server code into the client bundle. The current tsconfig enables it; the replacement must not.

## Goals / Non-Goals

**Goals:**

- Replace the SPA with an in-repo TanStack Start app (Vite, not Rsbuild) plus shadcn/ui, matching the official shadcn `start` template layout.
- Keep git history, OpenSpec, `AGENTS.md`, and Vite+ as the CLI and linter/formatter.
- Ship a home page composed of shadcn `Card` + `Button` so the stack is visibly working.

**Non-Goals:**

- Preserving Vite starter UI or the client counter.
- Auth, React Query, Clerk, Convex, Supabase, or other Start examples.
- Adopting the shadcn template’s ESLint/Prettier scripts.
- Adding Nitro or a production host adapter unless `vp build` requires it.
- A custom shadcn preset (use default `nova`).

## Decisions

### 1. Scaffold from shadcn `--template start`, then overlay

Use `pnpm dlx shadcn@latest init --template start --preset nova --no-monorepo` in a **temporary directory**, then copy the Start + shadcn app files into this repo.

**Why:** One command produces TanStack Start, Tailwind v4, `@/*`, and shadcn config together. That is the documented intersection of the user’s Start + shadcn request. Scaffolding in-temp avoids `init --name` replacing the git root or fighting the existing `package.json`.

**Alternatives:**

- TanStack CLI (`pnpm dlx @tanstack/cli@latest create`) then `shadcn init` in the existing project. Extra step; CLI may add a shadcn add-on we must skip; still need an overlay onto Vite+.
- Hand-wire Start from the “build from scratch” guide, then `shadcn init`. More drift from the official Start+shadcn tree (`shellComponent`, styles-as-URL, router factory).
- `shadcn init --template start --name` inside this repo. Creates a nested folder; worse than a temp overlay.

After overlay, add `card` (and `button` if the template did not) with `pnpm dlx shadcn@latest add card button`. Home route follows the shadcn TanStack docs: `Card` + `Button` imported from `@/components/ui/...`.

Do **not** implement the from-scratch `count.txt` server-function demo. Specs require a ready-to-build home card, not a file-backed counter.

### 2. Keep Vite+; merge Start plugins into `vite.config.ts`

Keep `import { defineConfig, lazyPlugins } from "vite-plus"` (required by `vite-plus/prefer-vite-plus-imports`). Plugin order:

1. `@tailwindcss/vite`
2. `tanstackStart()` (before React)
3. `viteReact()`

Optionally `@tanstack/devtools-vite` if the scaffold includes it.

Keep `pnpm-workspace.yaml` catalog overrides so Start’s `vite` dependency resolves to Vite+ core. Keep `package.json` scripts as `vp dev` / `vp build` / `vp preview` (and `prepare: vp config`). Do not copy template `eslint` / `prettier` scripts.

**Alternatives:**

- Switch `defineConfig` to `vite` as in Start docs. Fails the Vite+ lint rule and drops unified toolchain config.
- Drop Vite+ entirely. Conflicts with `AGENTS.md` and the catalog pin; only a fallback if Start cannot run on Vite+ core (see Risks).

### 3. Target layout (after overlay)

```
src/
  components/ui/     # shadcn primitives
  lib/utils.ts       # cn()
  routes/__root.tsx  # document shell, head, 404, styles link
  routes/index.tsx   # home Card + Button
  router.tsx         # getRouter()
  routeTree.gen.ts   # generated; commit it
  styles.css         # Tailwind + shadcn tokens
components.json
tsconfig.json        # jsx react-jsx, paths @/*, no verbatimModuleSyntax
vite.config.ts       # vite-plus + lazy Start/React/Tailwind plugins
```

Delete SPA files: `index.html`, `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/assets/*`, `public/icons.svg`. Start renders HTML from `__root.tsx` (`HeadContent` / `Scripts` / `shellComponent`), so the Vite SPA `index.html` must not remain as the entry.

Use the scaffold’s root-route API (`shellComponent` + `notFoundComponent` if present), not the older from-scratch `component` + `Outlet` wrapper, unless the installed Start version only supports the older shape.

### 4. TypeScript and aliases

- `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"paths": { "@/*": ["./src/*"] }`.
- Enable `resolve.tsconfigPaths` in Vite (Start and shadcn both rely on it).
- **Disable `verbatimModuleSyntax`** despite the current repo and the shadcn template enabling it, because Start documents server-bundle leakage with that flag.

### 5. shadcn defaults

- Template: `start`. Preset: `nova`. Base: radix (CLI default). Not a monorepo.
- Package runner: `pnpm dlx shadcn@latest` (lockfile is pnpm).
- Home page uses full `Card` composition (`CardHeader` / `CardTitle` / `CardDescription` / `CardContent`) plus `Button`. Semantic tokens (`bg-background`, `text-muted-foreground`), `flex` + `gap-*`, no `space-y-*`.

## Risks / Trade-offs

- [Start may not run on Vite+ core] → Prove `vp dev` and `vp build` after overlay. If the plugin or Vite version is incompatible, keep Vite+ for lint/fmt/test and isolate Start’s Vite config; only drop the catalog pin if Start cannot boot otherwise.
- [`verbatimModuleSyntax` vs shadcn template] → Disable it. If a generated shadcn file depends on the flag, adjust imports rather than re-enabling leakage.
- [Scaffold `init` wants a new directory] → Always scaffold in temp; copy; never run `init --name` as this repo’s root replacement.
- [Nitro missing from shadcn template] → Try build without Nitro. If Start’s current Vite plugin requires `nitro()` (as `start-basic` does), add `nitro/vite` in the same `lazyPlugins` list without changing specs.
- [Generated `routeTree.gen.ts` drift] → Commit the file like official templates; regenerate on first `vp dev`.

## Migration Plan

1. Scaffold Start+shadcn in a temp directory; do not commit that directory.
2. Overlay app source and `components.json`; merge dependencies into this `package.json`; rewrite `vite.config.ts` / `tsconfig.json` as above.
3. Delete SPA entry files listed in Decision 3.
4. `vp install`, then `vp check`. Fix Vite+ import and format issues.
5. `vp dev`: `/` shows the card home; an unknown path shows not-found; curl `/` includes the heading in HTML.
6. `vp build` to confirm SSR build.

Rollback: revert the change commit. No production deploy in this change.

## Open Questions

None. Preset (`nova`), bundler (Vite), and home UI (Card + Button, no server counter) are decided above and do not change the specs.
