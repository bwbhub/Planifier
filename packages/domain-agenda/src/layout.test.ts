import { describe, expect, it } from "vitest";

import { layoutOverlaps } from "./layout";

const places = (slots: { start: number; end: number }[]) =>
  layoutOverlaps(slots).map(({ start, column, columns }) => [start, column, columns]);

describe("layoutOverlaps", () => {
  it("ne rend rien pour une journée vide", () => {
    expect(layoutOverlaps([])).toEqual([]);
  });

  it("garde toute la largeur à des créneaux qui se suivent", () => {
    expect(
      places([
        { start: 60, end: 120 },
        { start: 120, end: 180 },
      ]),
    ).toEqual([
      [60, 0, 1],
      [120, 0, 1],
    ]);
  });

  it("met côte à côte des créneaux qui se chevauchent", () => {
    expect(
      places([
        { start: 90, end: 150 },
        { start: 60, end: 120 },
      ]),
    ).toEqual([
      [60, 0, 2],
      [90, 1, 2],
    ]);
  });

  it("donne la même largeur à tout un groupe, de proche en proche", () => {
    expect(
      places([
        { start: 0, end: 60 },
        { start: 30, end: 90 },
        { start: 60, end: 120 },
      ]),
    ).toEqual([
      [0, 0, 2],
      [30, 1, 2],
      [60, 0, 2],
    ]);
  });

  it("recommence à une colonne après un groupe", () => {
    expect(
      places([
        { start: 0, end: 60 },
        { start: 30, end: 60 },
        { start: 200, end: 260 },
      ]).at(-1),
    ).toEqual([200, 0, 1]);
  });

  it("garde les champs du créneau", () => {
    const [slot] = layoutOverlaps([{ start: 0, end: 10, id: "a" }]);
    expect(slot).toEqual({ start: 0, end: 10, id: "a", column: 0, columns: 1 });
  });
});
