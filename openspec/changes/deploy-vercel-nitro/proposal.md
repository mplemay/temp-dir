# Proposal

## Why

The app is a TanStack Start server that reads committed fixtures through server functions, and `main` is already on GitHub, but nothing in the repo tells Vercel to build that server. A plain Vite import would publish a static bundle, drop server routes, and leave the fixture loaders pointing at source paths that do not exist inside a deployed function.

## What Changes

- Add the Nitro Vite plugin so `vp build` on Vercel emits a TanStack Start server as Vercel Functions on Fluid Compute, with static assets on the CDN.
- Pin pnpm `12.8.1` with the `packageManager` field so Vercel’s Corepack install can read this lockfile and the `catalog:` specifiers. Do not override the install command with a bare `pnpm install`.
- Make the committed files under `src/data` available to those server functions after the server bundle is emitted. Loaders today resolve fixtures from `import.meta.url`, which will not point at `src/data` inside the function.
- Leave page behavior, fixture schemas, and generate scripts unchanged. Do not set an output directory, an Edge runtime, or a custom build command.

## Capabilities

### New Capabilities

- `vercel-hosting`: Production hosting of this TanStack Start app on Vercel through Nitro. Owns the install/build contract, the server-function runtime, and access to the committed `src/data` fixtures from that runtime. Does not own fixture schemas, ranking, or page layout.

### Modified Capabilities

- None. Existing browse, ranking, and shell requirements stay as they are. This change makes the same server functions runnable on Vercel.

## Impact

- **Code**: `package.json` (`nitro` dependency and `packageManager`), `vite.config.ts` (Nitro plugin, placed after `tanstackStart()` and before `viteReact()`). Fixture loaders under `src/lib/**/load.ts` if they must read a copied server asset instead of a source-relative path.
- **Dependencies**: Direct `nitro` dependency. pnpm stays `12.8.1`.
- **Systems**: GitHub `mplemay/temp-dir` on `main`, imported into the existing Vercel team. No Vercel project exists for this repo yet. No runtime secrets. OpenAI stays a generate-time devDependency.
- **Out of scope**: Custom domains, preview-protection, ISR, cron, Edge runtime, changing `postinstall` skill sync, and rewriting fixture content.
- **Assumptions**: Fixture files are included as Nitro server assets rather than inlined with `import.meta.glob`. Framework preset is left to detection and set to `tanstack-start` only if Vercel detects plain Vite. Connecting the GitHub repo is part of shipping, after the repo changes are on `main`.
