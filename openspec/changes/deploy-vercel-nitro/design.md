# Design

## Context

See proposal.md for why this repo is not yet deployable. The constraints that shape the approach:

- `vite.config.ts` builds through Vite+ (`vp build`) and registers plugins inside `lazyPlugins`. `devtools()` must stay first. TanStack Start and React are already there. Nitro is not installed.
- `package.json` has no `packageManager` field. pnpm `12.8.1` is only in `devEngines`, which Vercel does not read. Dependencies use `catalog:` and the lockfile is `lockfileVersion: 9.0`. Vercel’s documented pnpm range stops at 10 unless Corepack is pointed at a `packageManager` value.
- Server functions in `src/lib/browse/server.ts` call synchronous loaders. Those loaders `readFileSync` / `readdirSync` paths derived from `import.meta.url` under `src/data`. Tests and `scripts/rank-providers.ts` / `scripts/generate-briefs.ts` call the same loaders against the repo on disk.
- Nitro copies `serverAssets` into the server bundle and serves them in dev from the filesystem, but only if the server calls `useStorage`. Production assets are not files next to the source tree, so `readFileSync` of the original path will not see them. Public assets would expose the fixtures on the CDN, which these loaders do not need.

## Goals / Non-Goals

**Goals:**

- `vp build` on Vercel emits a TanStack Start server (Fluid Compute) plus CDN assets, with preset detection left on unless it comes back as plain Vite.
- One fixture read path for production that still lets tests and generate scripts keep synchronous filesystem loads.
- Corepack installs this lockfile with pnpm `12.8.1`.

**Non-Goals:**

- Changing fixture schemas, page layout, or generate-time OpenAI use.
- ISR, cron, Edge, custom domains, or a checked-in output directory.
- Forcing `preset: "vercel"` locally. Nitro selects that preset when `VERCEL=1`. A local `vp build` may keep emitting a Node `.output`.

## Decisions

### 1. Nitro plugin, statically imported

Install `nitro` as a direct dependency and import `{ nitro }` from `nitro/vite` at the top of `vite.config.ts`. Call `nitro()` in the plugin array returned by `lazyPlugins`, after `tanstackStart()` and before `viteReact()`:

```text
devtools() -> tailwindcss() -> tanstackStart() -> nitro() -> viteReact()
```

A static `nitro/vite` import keeps the module id in the config source so Vercel’s TanStack Start detector can see it. The plugin still has to run inside the real Vite build; `lazyPlugins` already does that once config-metadata resolution is over.

Do not add `vercel.json` `outputDirectory`, `buildCommand`, or `installCommand` on the first attempt. Do not set `preset` on `nitro()`. If the imported project’s framework preset is Vite rather than TanStack Start, set the framework to `tanstack-start` and redeploy without an output directory.

Alternative considered: dynamic `import("nitro/vite")` inside `lazyPlugins` only. That matches the other plugins, but it is the same shape that can hide the server build from framework detection. The static import is the smaller risk.

### 2. Pin pnpm with `packageManager`

Set `"packageManager": "pnpm@12.8.1"` next to the existing `devEngines` entry. Leave the install command unset so Vercel uses Corepack instead of the oldest pnpm on the image.

Alternative considered: `installCommand: "pnpm install"`. Vercel documents that a bare override uses the oldest pnpm in the build image (pnpm 6), which cannot read this lockfile or `catalog:`.

### 3. Server assets for `src/data`, filesystem loaders stay synchronous

Register a Nitro server asset mount:

```ts
serverAssets: [{ baseName: "data", dir: "./src/data" }];
```

Pass that on `nitro()` if the plugin options accept a Nitro config. If they do not, put the same object in `nitro.config.ts`. Do not move fixtures into `public/` or an `assets/` directory at the repo root.

`useStorage("assets:data")` from `nitro/storage` is what causes Nitro to keep those files in the server bundle. This beta does not export `useKV`. Production reads are lazy imports, not disk files. In dev, the same mount reads `src/data` from disk.

Keep `loadRankedProviders`, `loadMarketIntelligence`, `loadCrmNotes`, `loadProductKnowledge`, and `loadProviderBrief` synchronous. Tests and the generate scripts keep calling them against the repo. `src/lib/browse/server.ts` is the production branch:

- When the source fixture path exists, call the synchronous loaders (local `vp dev`, tests that import the server module).
- When it does not, read the same relative keys from `useStorage("assets:data")` and pass the text into the existing parse functions. Product knowledge lists markdown keys on that mount and reuses the current per-file schema loop, extracted only if the directory loader cannot accept an in-memory file list.
- A missing key still throws the loader’s existing missing-fixture error. Do not return an empty success.

Alternative considered: `import.meta.glob` of every JSON and markdown file. That also survives bundling, but it rewrites every loader and drops Nitro’s dev filesystem mount. Server assets keep one directory and the directory listing the assay catalog needs.

Alternative considered: making every `load*` function async. That touches the generate scripts and the fixture tests for a fallback only the server handlers need.

### 4. No runtime environment variables

Do not add env vars for the first deployment. Browse handlers only read committed fixtures. `OPENAI_API_KEY` stays a generate-script concern and must not be required on Vercel.

## Risks / Trade-offs

- [Vercel Corepack refuses pnpm 12 because the docs list only through pnpm 10] → The build log is the check. If the install is not pnpm `12.8.1`, set `installCommand` to an explicit Corepack prepare of `pnpm@12.8.1` followed by `pnpm install`, never a bare `pnpm install`.
- [Framework preset comes back as Vite] → Static `nitro/vite` import plus `framework: tanstack-start` only after that happens. Do not set `outputDirectory` to `dist`, `.output`, or `.vercel/output`.
- [Server assets are dropped because nothing calls `useStorage`] → The server module must call `useStorage("assets:data")` on the production path, not only configure `serverAssets`.
- [`postinstall` (`skills experimental_sync`) or `prepare` (`vp config`) fails in the Vercel install] → Fix the script failure if the log shows it. Do not remove either script as part of the first plan.
- [Local `vp build` succeeds and the Vercel preset is still wrong] → A green local Node `.output` does not prove the Vercel preset. The deployment URL is the check: `/` HTML contains a ranked name, and a real brief route is not a platform 404.

## Migration Plan

1. Land the dependency, `packageManager` pin, Nitro plugin, and server-asset reads on `main`.
2. Import `mplemay/temp-dir` into the existing Vercel team. Confirm the preset is TanStack Start. Production tracks `main`; other branches are previews.
3. Open `/`, a provider brief, and the product-knowledge page on the deployment. No application env vars.
4. Rollback is a Vercel rollback to the previous deployment once one exists, or a revert of this commit if the first deployment is the bad one. Fixture files stay in `src/data` either way.
