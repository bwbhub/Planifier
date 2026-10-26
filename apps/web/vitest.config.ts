import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Environnement Node par défaut ; les tests de composants le déclarent (`@vitest-environment jsdom`).
// Le tsconfig de Next laisse le JSX intact (`preserve`) : Vite le transforme lui-même pour les tests.
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // e2e/ appartient à Playwright (`pnpm test:e2e`).
  test: { setupFiles: ["./vitest.setup.ts"], include: ["src/**/*.test.{ts,tsx}"] },
});
