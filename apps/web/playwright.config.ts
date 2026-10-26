import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

import { getE2eEnv } from "./e2e/env";

// Ports à part pour ne pas tomber sur les serveurs de `pnpm dev` (3000, 3001).
const WEB_PORT = 3100;
const API_PORT = 3101;
const WEB_URL = `http://localhost:${String(WEB_PORT)}`;
const API_URL = `http://localhost:${String(API_PORT)}`;

const { DATABASE_URL, CI } = getE2eEnv();

/**
 * Parcours de bout en bout sur le web construit (`next start`) et l'API, contre la base `_test`. Chromium seul
 * (docs/DEPENDANCES.md), en PC et en mobile émulé. Lancement : `pnpm test:e2e` (construit le web avant).
 */
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: CI,
  // Pas de nouvel essai : un test instable se voit, se tracke et se corrige (testing-standards).
  retries: 0,
  // Un seul navigateur à la fois : la limitation de débit de l'API compte par IP, et tout vient de localhost.
  workers: 1,
  reporter: CI ? "github" : "list",
  use: { baseURL: WEB_URL, trace: "retain-on-failure" },
  projects: [
    { name: "pc", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "pnpm --filter @planifier/api-server start",
      port: API_PORT,
      env: {
        NODE_ENV: "test",
        PORT: String(API_PORT),
        DATABASE_URL,
        // Secret jetable, tiré à chaque lancement : les sessions ne survivent pas au run.
        BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
        BETTER_AUTH_URL: WEB_URL,
      },
    },
    {
      // `next start` et non le serveur autonome (`output: standalone`) : celui-ci attend les fichiers statiques
      // copiés à côté de lui, ce que fera l'image Docker (ticket 869fhwtcc). Next le signale par un avertissement.
      command: `pnpm exec next start --port ${String(WEB_PORT)}`,
      url: `${WEB_URL}/connexion`,
      env: { API_INTERNAL_URL: API_URL },
    },
  ],
});
