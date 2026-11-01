import { type SelectHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";
import { FIELD_CONTROL_CLASSES } from "../lib/field";

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: readonly { value: string; label: string }[];
  /** Erreur : marque le champ invalide et s'annonce avec lui. */
  error?: string | undefined;
}

/** Liste de choix native avec libellé et erreur reliés, pour une liste trop longue pour `ChoiceGroup`. */
export function SelectField({ label, options, error, className, ...select }: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        className={cn("min-h-12", FIELD_CONTROL_CLASSES)}
        {...select}
      >
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
      {error === undefined ? null : (
        <p id={errorId} className="text-sm text-accent-text">
          {error}
        </p>
      )}
    </div>
  );
}
