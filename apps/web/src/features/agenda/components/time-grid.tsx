import { viewDays } from "@planifier/domain-agenda/view-days";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";
import type { CSSProperties } from "react";

import { dayNumber, fullDayLabel, weekdayLabel } from "../utils/agenda-dates";
import type { AgendaItem, DayContent } from "../utils/agenda-items";
import { dayContent, hoursRange } from "../utils/agenda-items";
import { EntryBlock } from "../atoms/entry-block";

/** Hauteur d'une heure, en pixels : la vue Jour respire davantage (maquette). */
const HOUR_HEIGHT = { day: 50, week: 42 };
/** Sous cette hauteur, l'horaire attend le survol. */
const COMPACT_HEIGHT = 44;
const HOURS_GUTTER = "w-12 shrink-0";

interface TimeGridProps {
  days: readonly string[];
  /** Jour de référence : son en-tête se distingue en vue Jour. */
  day: string;
  today: string;
  items: readonly AgendaItem[];
  /** Lien d'un jour de l'en-tête. */
  dayHref: (day: string) => string;
  onOpen: (item: AgendaItem) => void;
}

type DaySlot = DayContent["slots"][number];

/** Échelle des heures : première heure affichée, hauteur d'une heure en pixels. */
interface GridScale {
  firstHour: number;
  hourHeight: number;
}

type OpenEntry = (item: AgendaItem) => void;

function slotStyle({ start, end, column, columns }: DaySlot, scale: GridScale): CSSProperties {
  const height = ((end - start) / 60) * scale.hourHeight;
  return {
    top: (start / 60 - scale.firstHour) * scale.hourHeight,
    height,
    minHeight: height,
    left: `${String((column / columns) * 100)}%`,
    width: `${String(100 / columns)}%`,
  };
}

interface DayColumnProps {
  day: string;
  content: DayContent;
  scale: GridScale;
  hours: number;
  isToday: boolean;
  onOpen: OpenEntry;
}

function DayColumn({ content, scale, hours, isToday, onOpen }: DayColumnProps) {
  return (
    <div
      className={cn("relative min-w-0 flex-1 border-l border-line", isToday && "bg-today")}
      style={{ height: hours * scale.hourHeight }}
    >
      {content.slots.map((slot) => {
        const style = slotStyle(slot, scale);
        return (
          <EntryBlock
            key={slot.item.id}
            item={slot.item}
            style={style}
            compact={Number(style.height) < COMPACT_HEIGHT}
            onOpen={onOpen}
          />
        );
      })}
    </div>
  );
}

interface DayHeadingProps {
  day: string;
  isToday: boolean;
  selected: boolean;
  href: string;
}

function DayHeading({ day, isToday, selected, href }: DayHeadingProps) {
  return (
    <Link
      href={href}
      aria-label={fullDayLabel(day)}
      aria-current={isToday ? "date" : undefined}
      className="flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 text-xs text-muted"
    >
      {weekdayLabel(day)}
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-pill font-display text-base font-bold text-ink",
          selected && "bg-field",
          isToday && "bg-accent text-on-accent",
        )}
      >
        {dayNumber(day)}
      </span>
    </Link>
  );
}

type DayContents = readonly (DayContent & { day: string })[];

/** Entrées à la journée, jour par jour. */
function AllDayRow({ contents, onOpen }: { contents: DayContents; onOpen: OpenEntry }) {
  return (
    <div className="flex border-t border-line py-1">
      <div className={cn(HOURS_GUTTER, "text-xs text-muted")}>Jour</div>
      {contents.map(({ day, allDay }) => (
        <div key={day} className="flex min-w-0 flex-1 flex-col gap-1 px-0.5">
          {allDay.map((item) => (
            <EntryBlock key={item.id} item={item} compact onOpen={onOpen} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface HoursBodyProps {
  contents: DayContents;
  today: string;
  scale: GridScale;
  hours: number;
  onOpen: OpenEntry;
}

function HoursBody({ contents, today, scale, hours, onOpen }: HoursBodyProps) {
  return (
    <div className="flex border-t border-line">
      <div className={HOURS_GUTTER} aria-hidden="true">
        {Array.from({ length: hours }, (_, index) => (
          <div
            key={index}
            className="text-xs text-muted tabular-nums"
            style={{ height: scale.hourHeight }}
          >
            {String(scale.firstHour + index).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <div
        className="flex min-w-0 flex-1"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0, var(--line) 1px, transparent 1px, transparent ${String(scale.hourHeight)}px)`,
        }}
      >
        {contents.map((content) => (
          <DayColumn
            key={content.day}
            day={content.day}
            content={content}
            scale={scale}
            hours={hours}
            isToday={content.day === today}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

/** Grille horaire d'un ou plusieurs jours : en-tête, entrées à la journée, puis créneaux placés sans se recouvrir. */
export function TimeGrid({ days, day: shownDay, today, items, dayHref, onOpen }: TimeGridProps) {
  const contents = days.map((day) => ({ day, ...dayContent(items, day) }));
  const { first, last } = hoursRange(contents);
  const scale = {
    firstHour: first,
    hourHeight: days.length === 1 ? HOUR_HEIGHT.day : HOUR_HEIGHT.week,
  };
  // Vue Jour : la bande de sa semaine, pour passer d'un jour à l'autre (maquette).
  const singleDay = days.length === 1;
  const headings = singleDay ? viewDays("WEEK", shownDay) : days;

  return (
    <section aria-label="Grille de l'agenda" className="rounded-card bg-surface p-3">
      <div className="flex">
        {singleDay ? null : <div className={HOURS_GUTTER} />}
        {headings.map((day) => (
          <DayHeading
            key={day}
            day={day}
            isToday={day === today}
            selected={singleDay && day === shownDay}
            href={dayHref(day)}
          />
        ))}
      </div>
      {contents.some(({ allDay }) => allDay.length > 0) ? (
        <AllDayRow contents={contents} onOpen={onOpen} />
      ) : null}
      <HoursBody
        contents={contents}
        today={today}
        scale={scale}
        hours={last - first}
        onOpen={onOpen}
      />
    </section>
  );
}
