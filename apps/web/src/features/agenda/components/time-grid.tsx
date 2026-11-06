import { type GridPoint, shiftedWhen } from "@planifier/domain-agenda/move";
import { viewDays } from "@planifier/domain-agenda/view-days";
import { Button } from "@planifier/ui/components/button";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";
import type { CSSProperties } from "react";

import { dayNumber, fullDayLabel, weekdayLabel } from "../utils/agenda-dates";
import { agendaErrorMessage } from "../utils/agenda-error-message";
import type { AgendaItem, DayContent } from "../utils/agenda-items";
import { dayContent, hoursRange } from "../utils/agenda-items";
import { type GridScale, moveZone } from "../utils/move-zones";
import { type EntryMove, type MoveState, useEntryMove } from "../utils/use-entry-move";
import { GridActionsProvider, GridEntry } from "./grid-actions";

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

/** Point visé par l'entrée tirée à la souris, s'il tombe sur ce jour (heures, ou ligne des journées). */
function dropPointOn(state: MoveState, day: string, inHours: boolean): GridPoint | null {
  if (state.kind !== "dragging" || state.to?.day !== day) return null;
  return (state.to.minute !== null) === inHours ? state.to : null;
}

/** Où tomberait l'entrée tirée, dans cette colonne : la place qu'elle y prendrait. */
function DropPreview({ day, scale, state }: { day: string; scale: GridScale; state: MoveState }) {
  const to = dropPointOn(state, day, true);
  if (to === null || state.kind !== "dragging" || state.item.entry === null) return null;
  const when = shiftedWhen(state.item.entry.when, state.from, to);
  const slot = when === null ? undefined : dayContent([{ ...state.item, when }], day).slots[0];
  if (slot === undefined) return null;
  const { top, height } = slotStyle(slot, scale);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 rounded-control border-2 border-dashed border-accent"
      style={{ top, height }}
    />
  );
}

interface DayColumnProps {
  day: string;
  content: DayContent;
  scale: GridScale;
  hours: number;
  isToday: boolean;
  state: MoveState;
}

function DayColumn({ day, content, scale, hours, isToday, state }: DayColumnProps) {
  return (
    <div
      {...moveZone(day, scale)}
      className={cn("relative min-w-0 flex-1 border-l border-line", isToday && "bg-today")}
      style={{ height: hours * scale.hourHeight }}
    >
      <DropPreview day={day} scale={scale} state={state} />
      {content.slots.map((slot) => {
        const style = slotStyle(slot, scale);
        return (
          <GridEntry
            key={slot.item.id}
            item={slot.item}
            style={style}
            compact={Number(style.height) < COMPACT_HEIGHT}
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

/** Entrée décollée au doigt : dit quoi faire ensuite. Échec d'un déplacement : dit pourquoi. */
function MoveStatus({ move }: { move: EntryMove }) {
  const { state, error, cancel } = move;
  return (
    <>
      <div role="status" aria-live="polite">
        {state.kind === "lifted" ? (
          // En surimpression : la grille ne doit pas bouger sous le doigt qui vise un créneau.
          <div className="fixed inset-x-4 bottom-[calc(var(--nav-height,0px)+1rem)] z-30 mx-auto flex max-w-md flex-wrap items-center gap-2 rounded-card bg-ink p-3 text-sm text-surface">
            <span>
              « {state.item.title} » est décollée : touche un créneau pour la poser, ou un jour pour
              changer de jour.
            </span>
            <Button variant="secondary" onClick={cancel}>
              Annuler
            </Button>
          </div>
        ) : null}
      </div>
      {error === null ? null : (
        <p role="alert" className="pb-2 text-sm text-accent-text">
          {agendaErrorMessage(error)}
        </p>
      )}
    </>
  );
}

type DayContents = readonly (DayContent & { day: string })[];

/** Entrées à la journée : chaque jour est une cible pour en déplacer une. */
function AllDayRow({ contents, state }: { contents: DayContents; state: MoveState }) {
  return (
    <div className="flex border-t border-line py-1">
      <div className={cn(HOURS_GUTTER, "text-xs text-muted")}>Jour</div>
      {contents.map(({ day, allDay }) => (
        <div
          key={day}
          {...moveZone(day)}
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1 px-0.5",
            dropPointOn(state, day, false) !== null &&
              "rounded-control outline-2 outline-accent outline-dashed",
          )}
        >
          {allDay.map((item) => (
            <GridEntry key={item.id} item={item} compact />
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
  state: MoveState;
}

function HoursBody({ contents, today, scale, hours, state }: HoursBodyProps) {
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
            state={state}
          />
        ))}
      </div>
    </div>
  );
}

/** Grille horaire d'un ou plusieurs jours : en-tête, entrées à la journée, puis créneaux placés sans se recouvrir. */
export function TimeGrid({ days, day: shownDay, today, items, dayHref, onOpen }: TimeGridProps) {
  const move = useEntryMove();
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
    <GridActionsProvider value={{ move, onOpen }}>
      {/* Hors de la grille : toucher « Annuler » ne doit pas poser l'entrée. */}
      <MoveStatus move={move} />
      <section
        aria-label="Grille de l'agenda"
        className={cn(
          "rounded-card bg-surface p-3",
          move.state.kind === "dragging" && "cursor-grabbing",
        )}
        onClickCapture={(event) => {
          if (!move.claimClick(event.clientX, event.clientY, event.target)) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
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
          <AllDayRow contents={contents} state={move.state} />
        ) : null}
        <HoursBody
          contents={contents}
          today={today}
          scale={scale}
          hours={last - first}
          state={move.state}
        />
      </section>
    </GridActionsProvider>
  );
}
