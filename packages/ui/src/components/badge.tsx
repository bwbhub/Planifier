import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

const TONES = {
  neutral: "bg-field text-muted",
  accent: "bg-accent-tint text-accent-text",
  /** Compteur à repérer (non-lus) : plein, texte sur l'accent. */
  strong: "bg-accent text-on-accent",
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** Pastille de texte (rôle, statut, compteur). Le sens est toujours écrit : la teinte n'est qu'un appui. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
