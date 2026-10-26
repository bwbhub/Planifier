import { describe, expect, it } from "vitest";

import { themeAttribute } from "./theme-attribute";

describe("themeAttribute", () => {
  it("laisse l'appareil décider sans préférence, impose sinon le thème choisi", () => {
    expect(themeAttribute("SYSTEM")).toBeUndefined();
    expect(themeAttribute("LIGHT")).toBe("light");
    expect(themeAttribute("DARK")).toBe("dark");
  });
});
