import { randomBytes } from "node:crypto";

import type { ImportsDeps } from "./imports-deps";
import { createSecretBox } from "./secret-box";

/** Dépendances d'import pour les tests : flux servi par `fetchFeed` (aucun réseau), vraie boîte à secrets, horloge fixée. */
export function testImportsDeps(overrides: Partial<ImportsDeps> = {}): ImportsDeps {
  return {
    fetchFeed: () => Promise.reject(new Error("Pas de lecture de flux dans ce test.")),
    secretBox: createSecretBox(randomBytes(32)),
    now: () => new Date("2026-11-08T12:00:00Z"),
    ...overrides,
  };
}
