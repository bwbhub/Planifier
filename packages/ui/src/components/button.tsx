import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "bg-field text-ink hover:bg-line",
  /** Action d'une ligne de réglage (révoquer, quitter) : contour seul, moins présente qu'une action principale. */
  outline: "bg-transparent text-ink ring-2 ring-line ring-inset hover:bg-field",
  /** Confirmation d'une action définitive, dans une feuille : contraste maximal, sans couleur d'alerte. */
  strong: "bg-ink text-bg hover:opacity-90",
} as const;

const SIZES = {
  md: "min-h-12.5 px-6",
  /** Dans une ligne ou une carte : 44 px, la cible tactile minimale. */
  sm: "min-h-11 px-4.5",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

interface ButtonStyle {
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
    "inline-flex items-center justify-center gap-2 rounded-pill text-control font-semibold",
    "transition-opacity motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}

/** Bouton d'action. `type="button"` par défaut : un envoi de formulaire se déclare (`type="submit"`). */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, className })} {...props} />
  );
}
