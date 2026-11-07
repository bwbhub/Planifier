import { Avatar } from "@planifier/ui/components/avatar";
import { cn } from "@planifier/ui/lib/cn";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";

import type { AgendaItem } from "../utils/agenda-items";
import { itemLabel, whenLabel } from "../utils/agenda-items";
import { participantsLabel } from "../utils/agenda-participants";
import type { MovingKind } from "../utils/use-entry-move";
import { SlotBlock } from "./slot-block";

/** Détail montré au survol ou au focus (le lieu, toujours : maquette). */
const ON_HOVER = "hidden text-muted group-hover:inline group-focus:inline";
/** Ligne secondaire : toujours visible, ou seulement au survol quand le bloc est trop bas. */
const detailClass = (compact: boolean) => (compact ? ON_HOVER : "text-muted");

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

/** Placé dans sa colonne ; serré parmi d'autres, il s'étale au survol ou au focus (maquette). */
const PLACED =
  "absolute transition-[left,width] hover:left-0! hover:z-20 hover:h-auto! hover:w-full! focus:left-0! focus:z-20 focus:h-auto! focus:w-full! motion-reduce:transition-none";

/** Tirée ou en cours d'envoi : estompée ; décollée : soulignée, au-dessus des autres. */
const MOVING: Record<MovingKind, string> = {
  dragging: "opacity-50",
  saving: "opacity-50",
  lifted: "z-20 ring-2 ring-accent",
};

/** Lieu et personnes sous l'horaire ; l'entrée d'une autre personne en montre l'avatar au pied du bloc. */
function Details({ item, compact }: { item: AgendaItem; compact: boolean }) {
  const { location, participants } = item;
  const withPeople = participantsLabel(participants);
  return (
    <>
      {location === null ? null : <span className={ON_HOVER}>{location}</span>}
      {/* Participants toujours montrés quand la place le permet (maquette). */}
      {withPeople === null ? null : <span className={detailClass(compact)}>{withPeople}</span>}
    </>
  );
}

function OwnerAvatar({ owner, compact }: { owner: AgendaItem["owner"]; compact: boolean }) {
  if (owner === null) return null;
  return (
    <span className={cn(compact && "hidden group-hover:block group-focus:block")}>
      <Avatar id={owner.userId} name={owner.name} size="sm" />
    </span>
  );
}

/**
 * Créneau d'une grille, composé sur `SlotBlock`. Une entrée d'une autre personne se lit seulement : elle prend le
 * focus sans être un bouton. La mienne s'ouvre au clic et se déplace (`useEntryMove`).
 */
export function EntryBlock({
  item,
  style,
  compact = false,
  onOpen,
  onPress,
  moving = null,
}: EntryBlockProps) {
  const common = {
    title: item.title,
    time: whenLabel(item.when),
    timeClassName: detailClass(compact),
    background: item.background,
    "aria-label": itemLabel(item),
    style,
    children: <Details item={item} compact={compact} />,
    footer: <OwnerAvatar owner={item.owner} compact={compact} />,
  };
  const placed = style === undefined ? undefined : PLACED;
  if (item.entry === null) return <SlotBlock interactive={false} className={placed} {...common} />;
  return (
    <SlotBlock
      interactive
      data-entry-id={item.id}
      aria-busy={moving === "saving" || undefined}
      hidden={item.entry.hidden}
      className={cn(
        placed,
        onPress !== undefined && "touch-manipulation select-none [-webkit-touch-callout:none]",
        moving === null ? null : MOVING[moving],
      )}
      onPointerDown={(event) => {
        onPress?.(item, event);
      }}
      onContextMenu={onPress === undefined ? undefined : preventTouchMenu}
      onClick={() => {
        onOpen(item);
      }}
      {...common}
    />
  );
}
