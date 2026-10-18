import { describe, expect, it } from "vitest";

import { assertSeedAllowed } from "./guard";

describe("assertSeedAllowed", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("autorise le seed sur l'hôte local %s", (host) => {
    expect(() => {
      assertSeedAllowed(`postgresql://u:p@${host}:5433/planifier`, "development");
    }).not.toThrow();
  });

  it("refuse le seed quand NODE_ENV vaut production, même sur un hôte local", () => {
    expect(() => {
      assertSeedAllowed("postgresql://u:p@localhost:5433/planifier", "production");
    }).toThrow("NODE_ENV=production");
  });

  it("refuse le seed quand l'hôte n'est pas local", () => {
    expect(() => {
      assertSeedAllowed("postgresql://u:p@ep-exemple.neon.tech/planifier", "development");
    }).toThrow("la base n'est pas locale");
  });

  it("refuse un hôte qui contient seulement « localhost » dans son nom", () => {
    expect(() => {
      assertSeedAllowed("postgresql://u:p@localhost.exemple.com/planifier", "development");
    }).toThrow("la base n'est pas locale");
  });
});
