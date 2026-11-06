import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

const PADDINGS = {
  /** Panneau d'écran. */
  md: "p-5",
  /** Section de formulaire ou carte d'accueil. */
  lg: "px-6 py-8 sm:px-8",
} as const;

export type CardPadding = keyof typeof PADDINGS;

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Balise : `section` (nommée par `aria-label` ou `aria-labelledby`) ou `div`. */
  as?: "section" | "div";
  padding?: CardPadding;
}

/** Surface arrondie qui regroupe un contenu sur le fond de page. Sans métier : la mise en page interne est au parent. */
export function Card({ as: Tag = "div", padding = "md", className, ...props }: CardProps) {
  return <Tag className={cn("rounded-card bg-surface", PADDINGS[padding], className)} {...props} />;
}
