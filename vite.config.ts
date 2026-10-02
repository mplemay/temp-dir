import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(async () => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    const { tanstackStart } = await import("@tanstack/react-start/plugin/vite");
    const { default: viteReact } = await import("@vitejs/plugin-react");
    const { devtools } = await import("@tanstack/devtools-vite");

    return [devtools(), tailwindcss(), tanstackStart(), viteReact()];
  }),
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
