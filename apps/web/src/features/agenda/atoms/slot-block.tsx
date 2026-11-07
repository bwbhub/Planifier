import { cn } from "@planifier/ui/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

/** Mots des états d'un créneau : dits en toutes lettres, jamais par la seule bordure ou l'opacité. */
const SLOT_LABELS = {
  maybe: "Peut-être",
  greyed: "Tâche faite",
} as const;

export interface SlotBlockProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "hidden"> {
  /** `button` : s'ouvre au clic ; `group` : se lit seulement, mais prend le focus. */
  as: "button" | "group";
  title: string;
  /** Horaire déjà formaté. */
  time: string;
  /** Classes de la ligne d'horaire (par défaut : discrète) ; l'appelant la cache quand la place manque. */
  timeClassName?: string | undefined;
  /** Fond (token de teinte), en classe entière. */
  background: string;
  /** Pas sûr d'y aller : bordure pointillée d'accent et mot « Peut-être ». */
  maybe?: boolean | undefined;
  /** Tâche liée cochée : estompé, avec la mention. */
  greyed?: boolean | undefined;
  /** Masqué aux autres, visible de son seul propriétaire : pointillés discrets. */
  hidden?: boolean | undefined;
  /** Lignes sous l'horaire (lieu, personnes…). */
  children?: ReactNode;
  /** Pied du bloc (avatar). */
  footer?: ReactNode;
}

const BLOCK =
  "group flex flex-col gap-0.5 overflow-hidden rounded-control border-2 px-2 py-1 text-left text-xs text-ink";

function borderOf({ maybe, hidden }: Pick<SlotBlockProps, "maybe" | "hidden">) {
  if (maybe === true) return "border-dashed border-accent-text";
  return hidden === true ? "border-dashed border-muted" : "border-surface";
}

/**
 * Créneau horaire : titre, horaire, états (peut-être, grisé, masqué). Pure présentation, sans requête ni règle d'agenda :
 * l'appelant donne les mots, la teinte et les gestes (props de l'élément). Reste dans `agenda` tant qu'un seul module
 * s'en sert ; l'écran Aujourd'hui le fera monter dans `features/_shared`.
 */
export function SlotBlock({
  as,
  title,
  time,
  timeClassName = "text-muted",
  background,
  maybe,
  greyed,
  hidden,
  children,
  footer,
  className,
  ...rest
}: SlotBlockProps) {
  const classes = cn(
    BLOCK,
    background,
    borderOf({ maybe, hidden }),
    greyed === true && "opacity-60",
    className,
  );
  const content = (
    <>
      <span className="font-semibold">{title}</span>
      <span className={timeClassName}>{time}</span>
      {maybe === true ? <span className="font-semibold">{SLOT_LABELS.maybe}</span> : null}
      {greyed === true ? <span className="text-muted">{SLOT_LABELS.greyed}</span> : null}
      {children}
      {footer}
    </>
  );
  if (as === "button") {
    return (
      <button type="button" className={classes} {...rest}>
        {content}
      </button>
    );
  }
  return (
    <div role="group" tabIndex={0} className={classes} {...rest}>
      {content}
    </div>
  );
}
