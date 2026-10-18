import { afterEach, describe, expect, it, vi } from "vitest";

import { getDbEnv } from "./env";

describe("getDbEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renvoie l'URL et NODE_ENV quand l'environnement est valide", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/planifier");
    vi.stubEnv("NODE_ENV", "test");

    expect(getDbEnv()).toEqual({
      DATABASE_URL: "postgresql://u:p@localhost:5433/planifier",
      NODE_ENV: "test",
    });
  });

  it("échoue quand DATABASE_URL est absente", () => {
    vi.stubEnv("DATABASE_URL", undefined);

    expect(() => getDbEnv()).toThrow();
  });

  it("échoue quand DATABASE_URL n'est pas une URL", () => {
    vi.stubEnv("DATABASE_URL", "pas-une-url");

    expect(() => getDbEnv()).toThrow();
  });

  it("échoue quand NODE_ENV est inconnu", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/planifier");
    vi.stubEnv("NODE_ENV", "staging");

    expect(() => getDbEnv()).toThrow();
  });
});
