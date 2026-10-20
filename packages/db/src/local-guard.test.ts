import { describe, expect, it } from "vitest";

import { assertLocalDatabase, assertTestDatabase } from "./local-guard";

describe("assertLocalDatabase", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("autorise l'hôte local %s", (host) => {
    expect(() => {
      assertLocalDatabase(`postgresql://u:p@${host}:5433/planifier`, "development", "Seed");
    }).not.toThrow();
  });

  it("refuse quand NODE_ENV vaut production, même sur un hôte local", () => {
    expect(() => {
      assertLocalDatabase("postgresql://u:p@localhost:5433/planifier", "production", "Seed");
    }).toThrow("Seed refusé : NODE_ENV=production");
  });

  it("refuse quand l'hôte n'est pas local", () => {
    expect(() => {
      assertLocalDatabase("postgresql://u:p@ep-exemple.neon.tech/planifier", "development", "Seed");
    }).toThrow("la base n'est pas locale");
  });

  it("refuse un hôte qui contient seulement « localhost » dans son nom", () => {
    expect(() => {
      assertLocalDatabase(
        "postgresql://u:p@localhost.exemple.com/planifier",
        "development",
        "Seed",
      );
    }).toThrow("la base n'est pas locale");
  });
});

describe("assertTestDatabase", () => {
  it("autorise une base locale en _test", () => {
    expect(() => {
      assertTestDatabase("postgresql://u:p@localhost:5433/planifier_test", "test", "Remise à zéro");
    }).not.toThrow();
  });

  it("refuse la base locale de développement", () => {
    expect(() => {
      assertTestDatabase("postgresql://u:p@localhost:5433/planifier", "test", "Remise à zéro");
    }).toThrow("n'est pas une base de test");
  });

  it("refuse une base distante même en _test", () => {
    expect(() => {
      assertTestDatabase(
        "postgresql://u:p@ep-exemple.neon.tech/planifier_test",
        "test",
        "Remise à zéro",
      );
    }).toThrow("la base n'est pas locale");
  });
});
