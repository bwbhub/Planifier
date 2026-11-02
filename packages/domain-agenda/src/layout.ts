/** Créneau d'une journée : `start` inclus, `end` exclu, dans une même unité (minutes depuis minuit, par exemple). */
export interface Slot {
  start: number;
  end: number;
}

/** Place d'un créneau : colonne `column` (depuis 0) parmi les `columns` de son groupe de chevauchements. */
export type PlacedSlot<T extends Slot> = T & { column: number; columns: number };

function byStartThenLongest(a: Slot, b: Slot): number {
  return a.start - b.start || b.end - a.end;
}

/** Première colonne libre au début de `slot` : chaque colonne retient la fin de son dernier créneau. */
function freeColumn(columnEnds: readonly number[], { start }: Slot): number {
  const column = columnEnds.findIndex((end) => end <= start);
  return column === -1 ? columnEnds.length : column;
}

/** Un groupe : ses créneaux se touchent de proche en proche, et tous prennent la même largeur. */
function placeGroup<T extends Slot>(group: readonly T[]): PlacedSlot<T>[] {
  const columnEnds: number[] = [];
  const placed = group.map((slot) => {
    const column = freeColumn(columnEnds, slot);
    columnEnds[column] = slot.end;
    return { slot, column };
  });
  return placed.map(({ slot, column }) => ({ ...slot, column, columns: columnEnds.length }));
}

/** Colonne de chaque créneau, triés par début : des créneaux qui se chevauchent ne se recouvrent jamais. */
export function layoutOverlaps<T extends Slot>(slots: readonly T[]): PlacedSlot<T>[] {
  const groups: T[][] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;
  for (const slot of [...slots].sort(byStartThenLongest)) {
    const current = groups.at(-1);
    if (current !== undefined && slot.start < groupEnd) {
      current.push(slot);
      groupEnd = Math.max(groupEnd, slot.end);
    } else {
      groups.push([slot]);
      groupEnd = slot.end;
    }
  }
  return groups.flatMap(placeGroup);
}
