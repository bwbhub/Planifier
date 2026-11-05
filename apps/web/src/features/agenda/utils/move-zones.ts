import type { GridPoint } from "@planifier/domain-agenda/move";

/** Échelle des heures d'une grille : première heure affichée, hauteur d'une heure en pixels. */
export interface GridScale {
  firstHour: number;
  hourHeight: number;
}

/** Pas d'un déplacement, en minutes. */
const MOVE_STEP_MINUTES = 15;
const MINUTES_PER_DAY = 1440;

/** Minute visée à `offset` pixels du haut d'une colonne, arrondie au pas, dans la journée. */
export function minuteAt(offset: number, { firstHour, hourHeight }: GridScale): number {
  const raw = firstHour * 60 + (offset / hourHeight) * 60;
  const snapped = Math.round(raw / MOVE_STEP_MINUTES) * MOVE_STEP_MINUTES;
  return Math.min(Math.max(snapped, 0), MINUTES_PER_DAY - MOVE_STEP_MINUTES);
}

/**
 * Attributs d'une zone où l'on peut prendre et poser une entrée : une colonne d'heures (`scale`), ou un jour de la
 * ligne des journées. `pointAt` les relit : c'est le seul contrat entre la grille et le déplacement.
 */
export function moveZone(day: string, scale?: GridScale) {
  return scale === undefined
    ? { "data-move-day": day }
    : {
        "data-move-day": day,
        "data-move-first-hour": scale.firstHour,
        "data-move-hour-height": scale.hourHeight,
      };
}

/** Point de la grille sous un point de l'écran, ou `null` hors des zones. */
export function pointAt(x: number, y: number): GridPoint | null {
  const zone = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-move-day]");
  const day = zone?.dataset.moveDay;
  if (zone === null || zone === undefined || day === undefined) return null;
  const { moveFirstHour, moveHourHeight } = zone.dataset;
  if (moveFirstHour === undefined || moveHourHeight === undefined) return { day, minute: null };
  const scale = { firstHour: Number(moveFirstHour), hourHeight: Number(moveHourHeight) };
  return { day, minute: minuteAt(y - zone.getBoundingClientRect().top, scale) };
}
