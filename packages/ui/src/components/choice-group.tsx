import { cn } from "../lib/cn";

export interface ChoiceOption<TValue extends string> {
  value: TValue;
  label: string;
}

export interface ChoiceGroupProps<TValue extends string> {
  legend: string;
  name: string;
  options: readonly ChoiceOption<TValue>[];
  defaultValue: TValue;
  className?: string | undefined;
}

/**
 * Choix unique parmi quelques options, en pastilles. Boutons radio natifs (clavier, formulaire, lecteurs d'écran) :
 * la valeur se lit dans le `FormData` du formulaire, sous `name`.
 */
export function ChoiceGroup<TValue extends string>({
  legend,
  name,
  options,
  defaultValue,
  className,
}: ChoiceGroupProps<TValue>) {
  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)}>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-pill bg-field px-4 text-control font-semibold",
              "text-ink hover:bg-line has-checked:bg-ink has-checked:text-surface",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
