import { describe, expect, it } from "vitest";

import { parseAuthEnv } from "./env";

const STRONG_SECRET = "Zq8vN1xK4mT7pR2wY5cB9dF3gH6jL0sA";

describe("parseAuthEnv", () => {
  it("accepte une configuration locale complète", () => {
    const env = parseAuthEnv({
      NODE_ENV: "development",
      BETTER_AUTH_SECRET: STRONG_SECRET,
      BETTER_AUTH_URL: "http://localhost:3000",
    });
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
  });

  it("refuse l'absence de secret (aucune valeur par défaut)", () => {
    expect(() =>
      parseAuthEnv({ NODE_ENV: "development", BETTER_AUTH_URL: "http://localhost:3000" }),
    ).toThrow();
  });

  it("refuse un secret de moins de 32 caractères", () => {
    expect(() =>
      parseAuthEnv({
        NODE_ENV: "development",
        BETTER_AUTH_SECRET: "trop-court",
        BETTER_AUTH_URL: "http://localhost:3000",
      }),
    ).toThrow();
  });

  it("refuse en production un secret trivial ou une origine en http", () => {
    const production = { NODE_ENV: "production", BETTER_AUTH_URL: "https://planifier.example" };
    expect(() => parseAuthEnv({ ...production, BETTER_AUTH_SECRET: "a".repeat(40) })).toThrow(
      /trivial/,
    );
    expect(() =>
      parseAuthEnv({
        ...production,
        BETTER_AUTH_SECRET: STRONG_SECRET,
        BETTER_AUTH_URL: "http://planifier.example",
      }),
    ).toThrow(/https/);
    expect(parseAuthEnv({ ...production, BETTER_AUTH_SECRET: STRONG_SECRET }).NODE_ENV).toBe(
      "production",
    );
  });
});
