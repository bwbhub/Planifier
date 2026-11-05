import { Avatar } from "@planifier/ui/components/avatar";
import { cn } from "@planifier/ui/lib/cn";
import type { CSSProperties } from "react";

import type { AgendaItem } from "../utils/agenda-items";
import { itemLabel, whenLabel } from "../utils/agenda-items";
import { participantsLabel } from "../utils/agenda-participants";

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

const BLOCK =
  "flex flex-col gap-0.5 overflow-hidden rounded-control border-2 border-surface px-2 py-1 text-left text-xs text-ink";
/** Placé dans sa colonne ; serré parmi d'autres, il s'étale au survol ou au focus (maquette). */
const PLACED =
  "absolute transition-[left,width] hover:left-0! hover:z-20 hover:h-auto! hover:w-full! focus:left-0! focus:z-20 focus:h-auto! focus:w-full! motion-reduce:transition-none";

function BlockContent({ item, compact }: { item: AgendaItem; compact: boolean }) {
  const { title, location, participants, when, owner } = item;
  const withPeople = participantsLabel(participants);
  const details = compact ? ON_HOVER : "text-muted";
  return (
    <>
      <span className="font-semibold">{title}</span>
      <span className={details}>{whenLabel(when)}</span>
      {location === null ? null : <span className={ON_HOVER}>{location}</span>}
      {/* Participants toujours montrés quand la place le permet (maquette). */}
      {withPeople === null ? null : <span className={details}>{withPeople}</span>}
      {owner === null ? null : (
        <span className={cn(compact && "hidden group-hover:block group-focus:block")}>
          <Avatar id={owner.userId} name={owner.name} size="sm" />
        </span>
      )}
    </>
  );
}

/**
 * Créneau d'une grille. Une entrée d'une autre personne se lit seulement : elle prend le focus sans être un bouton.
 * La mienne s'ouvre au clic.
 */
export function EntryBlock({ item, style, compact = false, onOpen }: EntryBlockProps) {
  const className = cn(BLOCK, "group", item.background, style !== undefined && PLACED);
  const content = <BlockContent item={item} compact={compact} />;
  if (item.entry === null) {
    return (
      <div
        role="group"
        tabIndex={0}
        aria-label={itemLabel(item)}
        style={style}
        className={className}
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
      className={cn(className, item.entry.hidden && "border-dashed border-muted")}
      onClick={() => {
        onOpen(item);
      }}
    >
      {content}
    </button>
  );
}
