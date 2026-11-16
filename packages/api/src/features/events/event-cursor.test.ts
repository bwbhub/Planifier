import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "./event-cursor";

describe("curseur de la liste", () => {
  it("se relit tel qu'il a été écrit", () => {
    const cursor = {
      startKey: new Date("2026-11-22T19:30:00.000Z"),
      id: "0199f3a2-7c4e-7d10-9a51-000000000001",
    };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it.each(["", "abc", "_id", "2026-11-22T19:30:00.000Z_", "pas une date_id"])(
    "refuse %j comme requête invalide",
    (value) => {
      expect(() => decodeCursor(value)).toThrow(expect.objectContaining({ code: "BAD_REQUEST" }));
    },
  );
});
