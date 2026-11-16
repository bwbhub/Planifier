import { describe, expect, it } from "vitest";

import { goingCount, hasRoomFor } from "./capacity";

describe("goingCount", () => {
  it("compte les participants et les invités sans compte qui y vont", () => {
    expect(
      goingCount({
        participants: ["GOING", "MAYBE", "GOING", "NOT_GOING", "PENDING"],
        visitorInvites: ["GOING", "PENDING", "MAYBE"],
      }),
    ).toBe(3);
  });

  it("rend zéro sans personne", () => {
    expect(goingCount({ participants: [], visitorInvites: [] })).toBe(0);
  });
});

describe("hasRoomFor", () => {
  it("accepte tout le monde quand les places sont illimitées", () => {
    expect(hasRoomFor({ max: null, going: 500, wasGoing: false })).toBe(true);
  });

  it("accepte tant qu'il reste une place", () => {
    expect(hasRoomFor({ max: 12, going: 11, wasGoing: false })).toBe(true);
  });

  it("refuse quand l'événement est complet", () => {
    expect(hasRoomFor({ max: 12, going: 12, wasGoing: false })).toBe(false);
  });

  it("garde sa place à qui y allait déjà, même complet ou plafond abaissé", () => {
    expect(hasRoomFor({ max: 12, going: 12, wasGoing: true })).toBe(true);
    expect(hasRoomFor({ max: 5, going: 9, wasGoing: true })).toBe(true);
  });
});
