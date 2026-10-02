# Tasks

## 1. Scaffold and overlay

- [x] 1.1 Scaffold a TanStack Start + shadcn app in a temp directory with `pnpm dlx shadcn@latest init --template start --preset nova --no-monorepo` and verify the temp tree includes `src/routes/__root.tsx`, `src/router.tsx`, `src/styles.css`, and `components.json`
- [x] 1.2 Overlay Start/shadcn source and `components.json` into this repo, merge runtime/dev dependencies into `package.json` without copying ESLint/Prettier scripts, keep `vp` scripts and the pnpm catalog, run `vp install`, and verify install completes with `@tanstack/react-start` and `react` present
- [x] 1.3 Delete the vanilla SPA entry (`index.html`, `src/main.ts`, `src/counter.ts`, `src/style.css`, starter assets, `public/icons.svg`) and verify those paths no longer exist

## 2. Vite+ and TypeScript config

- [x] 2.1 Rewrite `vite.config.ts` to use `defineConfig` and `lazyPlugins` from `vite-plus`, `resolve.tsconfigPaths: true`, and plugin order Tailwind → `tanstackStart()` → `viteReact()`, then verify `vp check` loads the config without evaluating Start during lint-only reads
- [x] 2.2 Update `tsconfig.json` for `jsx: react-jsx`, `@/*` → `./src/*`, and **no** `verbatimModuleSyntax`, then verify `vp check` type-check passes (or reports only overlay issues to fix in this group)

## 3. App shell

- [x] 3.1 Keep or adapt `src/routes/__root.tsx` so the document shell sets charset, viewport, a non-empty title, stylesheet link, `HeadContent`, `Scripts`, and a not-found view, then verify the file exports a root route with those head tags
- [x] 3.2 Keep `src/router.tsx` `getRouter()` and commit generated `src/routeTree.gen.ts` (regenerate on first `vp dev` if needed), then verify both files exist and the route tree includes `/` and `__root`

## 4. Design system and home page

- [x] 4.1 Run `pnpm dlx shadcn@latest add card button` if either primitive is missing, then verify `src/components/ui/card.tsx` and `src/components/ui/button.tsx` exist
- [x] 4.2 Implement `src/routes/index.tsx` with full Card composition plus a Button imported from `@/components/ui/*`, using semantic tokens and `flex`/`gap-*`, then verify the route has no Vite “Get started” copy, no “Count is” counter, and no inlined custom card/button markup
- [x] 4.3 Confirm `src/styles.css` (or the scaffold CSS file) defines shadcn theme tokens such as `--background` and `--foreground`, then verify the home layout uses `bg-background` / `text-muted-foreground` (or equivalent tokens) rather than raw palette classes

## 5. Integration

- [x] 5.1 Run `vp check` and verify format, lint, and type-check pass
- [x] 5.2 Run `vp dev` and verify `curl` of `/` returns HTML with charset, viewport, a title, and the home heading; an unknown path returns a not-found message in HTML; neither response contains Vite starter copy
- [x] 5.3 In the browser, open `/`, confirm the card and button render, activate the button without leaving `/`, then open an unknown path and confirm the not-found page
- [x] 5.4 Run `vp build` and verify the Start production build succeeds; if it fails for missing Nitro, add `nitro/vite` in `lazyPlugins` and re-run until build passes
