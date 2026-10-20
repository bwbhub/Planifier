import { describe, expect, it } from "vitest";

import { DISPLAY_NAME_MAX_LENGTH, parseDisplayName } from "./display-name";

describe("parseDisplayName", () => {
  it("retire les espaces de bord", () => {
    expect(parseDisplayName("  Alice  ")).toBe("Alice");
  });

  it.each(["", "   ", "x".repeat(DISPLAY_NAME_MAX_LENGTH + 1), undefined, 42])(
    "refuse %j",
    (name) => {
      expect(parseDisplayName(name)).toBeNull();
    },
  );
});
