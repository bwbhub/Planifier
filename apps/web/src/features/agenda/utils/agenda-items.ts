import type {
  AgendaEntryOutput,
  AgendaWhen,
  EntriesWindow,
  SpaceEntryOutput,
} from "@planifier/api-contract";
import { AGENDA_GRID_FIRST_HOUR, AGENDA_GRID_LAST_HOUR } from "@planifier/constants/agenda";
import { layoutOverlaps, type PlacedSlot, type Slot } from "@planifier/domain-agenda/layout";
import { tintOf } from "@planifier/ui/lib/tint";

import { TINTS } from "@/features/_shared/utils/tints";
import { formatDay, formatTime, today } from "@/lib/format-date";

import { dayMonthLabel } from "./agenda-dates";

const MINUTES_PER_DAY = 1440;
/** Un créneau très court garde une hauteur lisible, et se place comme tel. */
const MIN_SLOT_MINUTES = 30;

/** Entrée à afficher, qu'elle vienne de mon agenda ou de la vue fusionnée. */
export interface AgendaItem {
  id: string;
  title: string;
  location: string | null;
  when: AgendaWhen;
  /** Fond (token). Mon agenda : la teinte de l'entrée ; vue fusionnée : celle de la personne, comme son filtre. */
  background: string;
  /** Personne, en vue fusionnée. */
  owner: SpaceEntryOutput["owner"] | null;
  /** Entrée modifiable : les miennes seulement. */
  entry: AgendaEntryOutput | null;
}

export function fromMyEntry(entry: AgendaEntryOutput): AgendaItem {
  const { id, title, location, when, tint } = entry;
  return { id, title, location, when, background: TINTS[tint].background, owner: null, entry };
}

export function fromSpaceEntry({ id, title, location, when, owner }: SpaceEntryOutput): AgendaItem {
  const background = tintOf(owner.userId).background;
  return { id, title, location, when, background, owner, entry: null };
}

/** Minuit, heure de l'appareil, du jour `AAAA-MM-JJ`. */
export function localMidnight(day: string): Date {
  return new Date(`${day}T00:00`);
}

/** Période lue pour ces jours, dans les deux formes du contrat. */
export function windowOf(days: readonly string[]): EntriesWindow {
  const fromDay = days[0];
  const toDay = days.at(-1);
  if (fromDay === undefined || toDay === undefined) throw new Error("Période sans jour.");
  const to = localMidnight(toDay);
  to.setDate(to.getDate() + 1);
  return { from: localMidnight(fromDay), to, fromDay, toDay };
}

/** Minutes à l'horloge : un jour de changement d'heure, le temps écoulé depuis minuit ne donne pas la bonne ligne. */
const minutesOnClock = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** Créneau d'une entrée horaire dans une journée, en minutes depuis minuit ; il s'arrête à minuit. */
function slotInDay(item: AgendaItem, day: string): (Slot & { item: AgendaItem }) | null {
  if (item.when.allDay) return null;
  const { startsAt, endsAt } = item.when;
  const { from: midnight, to: nextMidnight } = windowOf([day]);
  if (startsAt >= nextMidnight || endsAt <= midnight) return null;
  const start = Math.min(
    startsAt < midnight ? 0 : minutesOnClock(startsAt),
    MINUTES_PER_DAY - MIN_SLOT_MINUTES,
  );
  const end = endsAt >= nextMidnight ? MINUTES_PER_DAY : minutesOnClock(endsAt);
  return { item, start, end: Math.max(end, start + MIN_SLOT_MINUTES) };
}

export interface DayContent {
  allDay: AgendaItem[];
  slots: PlacedSlot<Slot & { item: AgendaItem }>[];
}

/** Ce qu'une journée affiche : entrées à la journée, et créneaux placés sans se recouvrir. */
export function dayContent(items: readonly AgendaItem[], day: string): DayContent {
  return {
    allDay: items.filter(({ when }) => when.allDay && when.startDay <= day && day <= when.endDay),
    slots: layoutOverlaps(
      items.flatMap((item) => {
        const slot = slotInDay(item, day);
        return slot === null ? [] : [slot];
      }),
    ),
  };
}

/** Heures de la grille : celles de la maquette, élargies aux créneaux qui en sortent. */
export function hoursRange(contents: readonly DayContent[]): { first: number; last: number } {
  const slots = contents.flatMap(({ slots: daySlots }) => daySlots);
  return {
    first: Math.floor(
      Math.min(AGENDA_GRID_FIRST_HOUR * 60, ...slots.map(({ start }) => start)) / 60,
    ),
    last: Math.ceil(Math.max(AGENDA_GRID_LAST_HOUR * 60, ...slots.map(({ end }) => end)) / 60),
  };
}

/** « 09:00 – 10:00 », « Toute la journée », et les dates si l'entrée s'étend sur plusieurs jours. */
export function whenLabel(when: AgendaWhen): string {
  if (when.allDay) {
    if (when.startDay === when.endDay) return "Toute la journée";
    return `Du ${dayMonthLabel(when.startDay)} au ${dayMonthLabel(when.endDay)}`;
  }
  const { startsAt, endsAt } = when;
  if (today(startsAt) === today(endsAt)) return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  return `${formatDay(startsAt)} ${formatTime(startsAt)} – ${formatDay(endsAt)} ${formatTime(endsAt)}`;
}

/** Ce qu'on sait d'une entrée, en une phrase : lecteur d'écran et infobulle. */
export function itemLabel({ title, when, location, owner, entry }: AgendaItem): string {
  const parts = [title, whenLabel(when), location, owner?.name];
  if (entry?.hidden === true) parts.push("masquée dans les Espaces");
  return parts.filter((part) => part !== null && part !== undefined).join(", ");
}
