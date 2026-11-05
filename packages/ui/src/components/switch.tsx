import { type InputHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "role"
> {
  label: string;
  /** Aide affichée sous l'interrupteur, lue avec lui par les lecteurs d'écran. */
  hint?: string | undefined;
}

/**
 * Interrupteur pour un réglage allumé ou éteint (s'applique tout de suite, ou à l'enregistrement du formulaire qui le porte) ; une réponse dans une liste de choix reste une case à cocher. Case native `role="switch"` :
 * clavier (Espace), formulaire et lecteurs d'écran sans code en plus. Éteint sauf `defaultChecked` explicite.
 */
export function Switch({ label, hint, className, ...input }: SwitchProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold",
          "has-disabled:cursor-not-allowed has-disabled:opacity-60",
        )}
      >
        {label}
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-describedby={hint === undefined ? undefined : hintId}
          className={cn(
            "peer relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-pill bg-line",
            "transition-colors motion-reduce:transition-none checked:bg-accent disabled:cursor-not-allowed",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "after:absolute after:top-1 after:left-1 after:size-5 after:rounded-pill after:bg-surface",
            "after:transition-transform motion-reduce:after:transition-none checked:after:translate-x-5",
          )}
          {...input}
        />
      </label>
      {hint === undefined ? null : (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
