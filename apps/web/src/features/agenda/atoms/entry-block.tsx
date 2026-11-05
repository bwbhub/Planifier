import { Avatar } from "@planifier/ui/components/avatar";
import { cn } from "@planifier/ui/lib/cn";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";

import type { AgendaItem } from "../utils/agenda-items";
import { itemLabel, whenLabel } from "../utils/agenda-items";
import { participantsLabel } from "../utils/agenda-participants";
import type { MovingKind } from "../utils/use-entry-move";

/** Détail montré au survol ou au focus (le lieu, toujours : maquette). */
const ON_HOVER = "hidden text-muted group-hover:inline group-focus:inline";

export interface EntryBlockProps {
  item: AgendaItem;
  /** Position dans sa colonne ; absente : dans le flux (entrée à la journée). */
  style?: CSSProperties | undefined;
  /** Trop bas pour le détail : il apparaît au survol ou au focus. */
  compact?: boolean | undefined;
  onOpen: (item: AgendaItem) => void;
  /** Appui sur une de mes entrées : peut-être un déplacement (`useEntryMove`). */
  onPress?: ((item: AgendaItem, event: PointerEvent) => void) | undefined;
  /** En cours de déplacement : tirée à la souris, décollée au doigt, ou posée et en cours d'envoi. */
  moving?: MovingKind | null | undefined;
}

/** Au doigt, l'appui long décolle l'entrée : pas de menu ni de sélection à sa place. À la souris, rien ne change. */
function preventTouchMenu(event: MouseEvent) {
  const { nativeEvent } = event;
  if ("pointerType" in nativeEvent && nativeEvent.pointerType !== "mouse") event.preventDefault();
}

const BLOCK =
  "flex flex-col gap-0.5 overflow-hidden rounded-control border-2 border-surface px-2 py-1 text-left text-xs text-ink";
/** Placé dans sa colonne ; serré parmi d'autres, il s'étale au survol ou au focus (maquette). */
const PLACED =
  "absolute transition-[left,width] hover:left-0! hover:z-20 hover:h-auto! hover:w-full! focus:left-0! focus:z-20 focus:h-auto! focus:w-full! motion-reduce:transition-none";

/** Tirée ou en cours d'envoi : estompée ; décollée : soulignée, au-dessus des autres. */
const MOVING: Record<MovingKind, string> = {
  dragging: "opacity-50",
  saving: "opacity-50",
  lifted: "z-20 ring-2 ring-accent",
};

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
 * La mienne s'ouvre au clic et se déplace (`useEntryMove`).
 */
export function EntryBlock({
  item,
  style,
  compact = false,
  onOpen,
  onPress,
  moving = null,
}: EntryBlockProps) {
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
      data-entry-id={item.id}
      aria-label={itemLabel(item)}
      aria-busy={moving === "saving" || undefined}
      style={style}
      className={cn(
        className,
        onPress !== undefined && "touch-manipulation select-none [-webkit-touch-callout:none]",
        item.entry.hidden && "border-dashed border-muted",
        moving === null ? null : MOVING[moving],
      )}
      onPointerDown={(event) => {
        onPress?.(item, event);
      }}
      onContextMenu={onPress === undefined ? undefined : preventTouchMenu}
      onClick={() => {
        onOpen(item);
      }}
    >
      {content}
    </button>
  );
}
