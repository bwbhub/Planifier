import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "bg-field text-ink hover:bg-line",
  /** Sur un fond teinté (en-tête de liste) : la pastille garde le contraste du fond de carte. */
  surface: "bg-surface text-ink hover:bg-line",
  /** Action discrète d'une ligne (modifier, supprimer) : texte seul, pastille au survol. */
  ghost: "text-muted hover:bg-field hover:text-ink",
} as const;

const SIZES = {
  /** Action principale de la maquette : 50 px de haut. */
  md: "min-h-12.5 px-6 text-control",
  /** Action secondaire dans une ligne ou un en-tête : 44 px, la cible tactile minimale. */
  sm: "min-h-11 px-3 text-sm",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonStyle {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Classes d'un bouton, pour donner son allure à un lien (`<Link>` de l'app) sans en faire un `<button>`. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyle = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-semibold",
    "transition-opacity motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}

/** Bouton d'action. `type="button"` par défaut : un envoi de formulaire se déclare (`type="submit"`). */
export function Button({ variant, size, type = "button", className, ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
  );
}
