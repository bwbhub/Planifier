import { type SelectHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: readonly { value: string; label: string }[];
}

/** Liste de choix native avec libellé relié (WCAG : libellé visible), pour une liste trop longue pour `ChoiceGroup`. */
export function SelectField({ label, options, className, ...select }: SelectFieldProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "min-h-12 rounded-control border-2 border-transparent bg-field px-3.5 text-base text-ink",
          "focus:border-accent focus:bg-surface disabled:opacity-60",
        )}
        {...select}
      >
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
