import { defineConfig } from "vitest/config";

const INTEGRATION_TESTS = "src/**/*.integration.test.ts";

// Deux projets : `unit` sans base (pnpm test), `integration` sur base réelle dédiée (pnpm test:integration).
export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["src/**/*.test.ts"], exclude: [INTEGRATION_TESTS] } },
      { test: { name: "integration", include: [INTEGRATION_TESTS] } },
    ],
  },
});
