import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EMAIL_COLORS, EMAIL_RADII } from "./email";

/** Variables CSS du premier bloc `selector` d'un fichier du package. */
function cssVariables(file: string, selector: RegExp): Map<string, string> {
  const css = readFileSync(new URL(file, import.meta.url), "utf8");
  const block = new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  return new Map(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = "", value = ""]) => [
      name,
      value.trim(),
    ]),
  );
}

const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe("EMAIL_COLORS", () => {
  it("reprend chaque couleur du thème clair de tokens.css", () => {
    const tokens = cssVariables("./tokens.css", /:root/);
    for (const [key, value] of Object.entries(EMAIL_COLORS)) {
      const name = kebab(key);
      expect({ name, value }).toEqual({ name, value: tokens.get(name) });
    }
  });
});

describe("EMAIL_RADII", () => {
  it("reprend chaque rayon de theme.css", () => {
    const tokens = cssVariables("./theme.css", /@theme inline/);
    for (const [key, value] of Object.entries(EMAIL_RADII)) {
      const name = `radius-${kebab(key)}`;
      expect({ name, value }).toEqual({ name, value: tokens.get(name) });
    }
  });
});
