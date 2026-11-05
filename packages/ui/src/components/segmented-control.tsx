import { cn } from "../lib/cn";
import type { ChoiceOption } from "./choice-group";

export interface SegmentedControlProps<TValue extends string> {
  /** Nom du groupe pour les lecteurs d'écran (ex. « Vue »). */
  label: string;
  name: string;
  options: readonly ChoiceOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  className?: string | undefined;
}

/**
 * Choix unique entre quelques vues d'un même contenu (Jour / Semaine / Mois), en bloc compact. Boutons radio
 * natifs : flèches du clavier, un seul arrêt de tabulation, annonce « 2 sur 3 ».
 */
export function SegmentedControl<TValue extends string>({
  label,
  name,
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex gap-1 rounded-pill bg-surface p-1", className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center rounded-pill px-4 text-sm font-medium",
            "text-ink hover:bg-field has-checked:bg-ink has-checked:font-semibold has-checked:text-surface",
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => {
              onValueChange(option.value);
            }}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
