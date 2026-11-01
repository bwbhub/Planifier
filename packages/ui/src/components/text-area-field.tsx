import { type TextareaHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";
import { FIELD_CONTROL_CLASSES } from "../lib/field";

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
        className={cn("min-h-24 py-3", FIELD_CONTROL_CLASSES)}
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
