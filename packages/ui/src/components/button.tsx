import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

const VARIANTS = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "bg-field text-ink hover:bg-line",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Bouton d'action. `type="button"` par défaut : un envoi de formulaire se déclare (`type="submit"`). */
export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold",
        "transition-opacity motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
