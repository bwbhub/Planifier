import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";

import { dayNumber, fullDayLabel, weekdayLabel } from "../utils/agenda-dates";
import type { AgendaItem } from "../utils/agenda-items";
import { dayContent, itemLabel } from "../utils/agenda-items";

/** Entrées montrées par case : au-delà, un compte. */
const MAX_PER_DAY = 3;

interface MonthGridProps {
  days: readonly string[];
  /** Jour de référence : ceux d'un autre mois s'effacent. */
  day: string;
  today: string;
  items: readonly AgendaItem[];
  dayHref: (day: string) => string;
}

function MonthEntry({ item }: { item: AgendaItem }) {
  return (
    <span
      title={itemLabel(item)}
      className={cn(
        "truncate rounded-control px-1.5 py-0.5 text-xs",
        item.background,
        item.entry?.hidden === true && "border border-dashed border-muted",
      )}
    >
      {item.title}
    </span>
  );
}

/**
 * Vue Mois : des semaines entières, du lundi au dimanche. Une case est un seul lien vers son jour, où l'on ouvre les
 * entrées ; elle dit tout ce qu'elle montre. La maquette ne montre pas cette vue : à revoir avec elle.
 */
export function MonthGrid({ days, day, today, items, dayHref }: MonthGridProps) {
  const month = day.slice(0, 7);
  return (
    <section aria-label="Grille de l'agenda" className="rounded-card bg-surface p-3">
      <div className="grid grid-cols-7 pb-2" aria-hidden="true">
        {days.slice(0, 7).map((weekDay) => (
          <span key={weekDay} className="text-center text-xs text-muted">
            {weekdayLabel(weekDay)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-line">
        {days.map((cell) => {
          const { allDay, slots } = dayContent(items, cell);
          const entries = [...allDay, ...slots.map(({ item }) => item)];
          const overflow = entries.length - MAX_PER_DAY;
          return (
            <Link
              key={cell}
              href={dayHref(cell)}
              aria-label={[fullDayLabel(cell), ...entries.map(itemLabel)].join(" ; ")}
              aria-current={cell === today ? "date" : undefined}
              className={cn(
                "flex min-h-24 min-w-0 flex-col gap-1 bg-surface p-1",
                cell === today && "bg-today",
                cell.slice(0, 7) !== month && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "min-h-6 text-xs font-semibold",
                  cell === today && "text-accent-text",
                )}
              >
                {dayNumber(cell)}
              </span>
              {entries.slice(0, MAX_PER_DAY).map((item) => (
                <MonthEntry key={item.id} item={item} />
              ))}
              {overflow > 0 ? <span className="text-xs text-muted">+{overflow}</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
