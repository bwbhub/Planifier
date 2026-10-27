import { CLIENT_IP_HEADER } from "@planifier/constants/http";
import { createTestDatabase } from "@planifier/db/testing";
import { DEMO_USERS } from "@planifier/db/seeding";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAuth } from "./auth";
import { DEMO_PASSWORD, seedDemoPasswords } from "./demo-passwords";
import { parseAuthEnv } from "./env";

// Base réelle dédiée en `_test` (`createTestDatabase`), vidée avant le fichier. Lancement : `pnpm test:integration`.
const { db, reset } = createTestDatabase();
const auth = createAuth(
  db,
  parseAuthEnv({
    NODE_ENV: "test",
    BETTER_AUTH_SECRET: "secret-de-test-integration-0123456789abcdef",
    BETTER_AUTH_URL: "http://localhost:3000",
  }),
  () => Promise.resolve(),
);

beforeAll(async () => {
  await reset();
  // Adresses vérifiées, comme dans le seed de `db` : la connexion l'exige.
  await db.user.createMany({ data: DEMO_USERS.map((user) => ({ ...user, emailVerified: true })) });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("seedDemoPasswords (base réelle)", () => {
  it("permet de se connecter aux comptes de démo, même relancé", async () => {
    await seedDemoPasswords(db);
    await seedDemoPasswords(db);

    await expect(db.account.count()).resolves.toBe(DEMO_USERS.length);
    for (const [index, { email }] of DEMO_USERS.entries()) {
      const session = await auth.api.signInEmail({
        body: { email, password: DEMO_PASSWORD },
        headers: new Headers({ [CLIENT_IP_HEADER]: `192.0.2.${String(100 + index)}` }),
      });
      expect(session.user.email).toBe(email);
    }
  });
});
