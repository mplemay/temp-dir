# Proposal

## Why

The repo is still the Vite+ vanilla TypeScript starter (`src/main.ts` injecting HTML into `#app`). That stack cannot host file-based routing, server functions, or a component library. Replacing it with TanStack Start and shadcn/ui gives a React SSR app we can actually build on, while keeping this repo’s Vite+ / pnpm toolchain.

## What Changes

- **BREAKING**: Remove the vanilla Vite SPA (`index.html`, `src/main.ts`, `src/counter.ts`, `src/style.css`, starter assets and public icons). The current “Get started” landing page and client-only counter go away.
- Add a TanStack Start application (Vite bundler, file-based TanStack Router) with a document shell, generated route tree, and an index route.
- Add shadcn/ui (Tailwind CSS v4, `components.json`, `@/*` alias) and use its components on the home page.
- Keep OpenSpec, git history, pnpm, and Vite+ (`vp` scripts, `vite-plus` config, catalog pin). Do not switch to the shadcn template’s Prettier/ESLint setup.

## Capabilities

### New Capabilities

- `app-shell`: TanStack Start application shell — HTML document, file-based routes, home page, and 404.
- `design-system`: shadcn/ui + Tailwind CSS setup and how UI is composed in routes.

### Modified Capabilities

- None. The project has no existing specs.

## Impact

- **Code**: Entire `src/` tree and `index.html` are replaced. `vite.config.ts` and `tsconfig.json` gain Start, React, Tailwind, and path-alias configuration while remaining Vite+ configs.
- **Dependencies**: Add `@tanstack/react-start`, `@tanstack/react-router`, React 19, Tailwind v4, shadcn/ui primitives. Keep `vite-plus` and the pnpm catalog that pins Vite to Vite+ core.
- **Runtime**: Dev/build become a Start SSR app (`vp dev` / `vp build`) instead of a static SPA. Vanilla entry `src/main.ts` no longer exists.
- **Out of scope**: Auth, React Query, Clerk/Convex/Supabase, Rsbuild, a monorepo, custom shadcn presets, and preserving the Vite starter UI.
