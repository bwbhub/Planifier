import { type InputHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Aide affichée sous le champ, lue avec lui par les lecteurs d'écran. */
  hint?: string | undefined;
  /** Erreur : marque le champ invalide et s'annonce avec lui. */
  error?: string | undefined;
}

/** Champ de saisie avec libellé, aide et erreur reliés au champ (WCAG : libellé visible, erreur décrite). */
export function TextField({ label, hint, error, className, ...input }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter((value) => value !== null)
    .join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        className={cn(
          "min-h-12 rounded-control border-2 border-transparent bg-field px-3.5 text-base text-ink",
          "placeholder:text-muted focus:border-accent focus:bg-surface aria-invalid:border-accent",
          "disabled:opacity-60",
        )}
        {...input}
      />
      {hint === undefined ? null : (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={errorId} className="text-sm text-accent-text">
          {error}
        </p>
      )}
    </div>
  );
}
