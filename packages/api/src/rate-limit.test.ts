import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("refuse au-delà du maximum dans la fenêtre, puis rouvre à la fenêtre suivante", () => {
    let now = 0;
    const consume = createRateLimiter({ max: 2, windowMs: 1000 }, () => now);
    expect([consume("a"), consume("a"), consume("a")]).toEqual([true, true, false]);
    now = 1000;
    expect(consume("a")).toBe(true);
  });

  it("compte chaque clé séparément", () => {
    const consume = createRateLimiter({ max: 1, windowMs: 1000 }, () => 0);
    expect([consume("a"), consume("b"), consume("a")]).toEqual([true, true, false]);
  });
});
