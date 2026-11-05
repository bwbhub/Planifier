import { Avatar } from "@planifier/ui/components/avatar";
import { cn } from "@planifier/ui/lib/cn";
import type { CSSProperties } from "react";

import type { AgendaItem } from "../utils/agenda-items";
import { itemLabel, participantsLabel, whenLabel } from "../utils/agenda-items";

/** Détail montré au survol ou au focus (le lieu, toujours : maquette). */
const ON_HOVER = "hidden text-muted group-hover:inline group-focus:inline";

interface EntryBlockProps {
  item: AgendaItem;
  /** Position dans sa colonne ; absente : dans le flux (entrée à la journée). */
  style?: CSSProperties | undefined;
  /** Trop bas pour le détail : il apparaît au survol ou au focus. */
  compact?: boolean | undefined;
  onOpen: (item: AgendaItem) => void;
}

/**
 * Créneau d'une grille. Serré parmi d'autres, il s'étale au survol ou au focus (maquette). Une entrée d'une autre
 * personne se lit seulement : elle prend le focus sans être un bouton.
 */
export function EntryBlock({ item, style, compact = false, onOpen }: EntryBlockProps) {
  const { title, location, participants, when, background, owner, entry } = item;
  const withPeople = participantsLabel(participants);
  const placed = style !== undefined;
  const className = cn(
    "flex flex-col gap-0.5 overflow-hidden rounded-control border-2 border-surface px-2 py-1 text-left text-xs text-ink",
    background,
    placed &&
      "absolute transition-[left,width] hover:left-0! hover:z-20 hover:h-auto! hover:w-full! focus:left-0! focus:z-20 focus:h-auto! focus:w-full! motion-reduce:transition-none",
  );
  const details = compact ? ON_HOVER : "text-muted";
  const content = (
    <>
      <span className="font-semibold">{title}</span>
      <span className={details}>{whenLabel(when)}</span>
      {location === null ? null : <span className={ON_HOVER}>{location}</span>}
      {withPeople === null ? null : <span className={ON_HOVER}>{withPeople}</span>}
      {owner === null ? null : (
        <span className={cn(compact && "hidden group-hover:block group-focus:block")}>
          <Avatar id={owner.userId} name={owner.name} size="sm" />
        </span>
      )}
    </>
  );
  if (entry === null) {
    return (
      <div
        role="group"
        tabIndex={0}
        aria-label={itemLabel(item)}
        style={style}
        className={cn(className, "group")}
      >
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={itemLabel(item)}
      style={style}
      className={cn(className, "group", entry.hidden && "border-dashed border-muted")}
      onClick={() => {
        onOpen(item);
      }}
    >
      {content}
    </button>
  );
}
