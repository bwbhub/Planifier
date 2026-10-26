import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EMAIL_COLORS } from "./email";

/** Variables du premier bloc `:root` (thème clair) de tokens.css. */
function lightTokens(): Map<string, string> {
  const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
  const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  return new Map(
    [...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = "", value = ""]) => [
      name,
      value.trim(),
    ]),
  );
}

describe("EMAIL_COLORS", () => {
  it("reprend chaque couleur du thème clair de tokens.css", () => {
    const tokens = lightTokens();
    for (const [key, value] of Object.entries(EMAIL_COLORS)) {
      const name = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      expect({ name, value }).toEqual({ name, value: tokens.get(name) });
    }
  });
});
