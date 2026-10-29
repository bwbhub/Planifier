import { type TextareaHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";

export interface TextAreaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> {
  label: string;
  /** Aide affichée sous le champ, lue avec lui par les lecteurs d'écran. */
  hint?: string | undefined;
  /** Erreur : marque le champ invalide et s'annonce avec lui. */
  error?: string | undefined;
}

/** Texte sur plusieurs lignes, avec libellé, aide et erreur reliés au champ (même allure que `TextField`). */
export function TextAreaField({ label, hint, error, className, ...textarea }: TextAreaFieldProps) {
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
      <textarea
        id={id}
        rows={3}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        className={cn(
          "min-h-24 rounded-control border-2 border-transparent bg-field px-3.5 py-3 text-base text-ink",
          "placeholder:text-muted focus:border-accent focus:bg-surface aria-invalid:border-accent",
          "disabled:opacity-60",
        )}
        {...textarea}
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
