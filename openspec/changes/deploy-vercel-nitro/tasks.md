# Tasks

## 1. Install contract

- [x] 1.1 Add `nitro` as a direct dependency and set `package.json` `packageManager` to `pnpm@12.8.1`, leaving `devEngines` as it is, then verify both fields are present and `pnpm install` completes with the committed lockfile
- [x] 1.2 Confirm the repo still has no `vercel.json` `installCommand`, `buildCommand`, or `outputDirectory`, and verify by checking that no such file overrides those settings

## 2. Nitro plugin

- [x] 2.1 Statically import `{ nitro }` from `nitro/vite` in `vite.config.ts` and call `nitro()` inside the `lazyPlugins` array after `tanstackStart()` and before `viteReact()`, with `devtools()` still first and no `preset` option, then verify that order in the config source
- [x] 2.2 Pass `serverAssets: [{ baseName: "data", dir: "./src/data" }]` to `nitro()`, or to `nitro.config.ts` if the plugin options reject a Nitro config, then verify the installed `nitro()` types accept the chosen form and `src/data` is not moved under `public/`

## 3. Production fixture reads

- [x] 3.1 In `src/lib/browse/server.ts`, keep calling the synchronous loaders when the source fixture path exists, and when it does not read the same relative keys through `useStorage("assets:data")` into the existing parse functions (extract an in-memory file list for product knowledge only if the directory loader cannot accept one), then verify a unit test covers a missing source path returning committed-fixture text and a missing key throwing the existing missing-fixture error
- [x] 3.2 Verify the synchronous `load*` functions used by `scripts/rank-providers.ts`, `scripts/generate-briefs.ts`, and the fixture tests are still synchronous filesystem reads, and that `vp test` passes those existing tests plus the new server-asset test

## 4. Deployment

- [x] 4.1 Run `vp build` and verify it finishes. A Node `.output` is acceptable locally. Do not treat that as proof of the Vercel preset
- [ ] 4.2 Push the repo changes to `main`, import `mplemay/temp-dir` into the existing Vercel team, and verify the project preset is TanStack Start. If the install log is not pnpm `12.8.1`, set `installCommand` to Corepack prepare `pnpm@12.8.1` then `pnpm install` and redeploy. If the preset is Vite, set the framework to `tanstack-start` without an output directory and redeploy
- [ ] 4.3 With no application environment variables set, open the production deployment and verify `/` HTML includes a ranked provider name without JavaScript, a brief URL for a committed NPI is that brief page rather than a platform 404, and the product-knowledge page lists a committed assay
