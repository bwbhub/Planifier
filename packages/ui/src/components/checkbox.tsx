import { type InputHTMLAttributes, useId } from "react";

import { cn } from "../lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  label: string;
  /** Aide affichée sous la case, lue avec elle par les lecteurs d'écran. */
  hint?: string | undefined;
}

/** Case à cocher avec libellé cliquable et aide reliée. Décochée sauf `defaultChecked` explicite. */
export function Checkbox({ label, hint, className, ...input }: CheckboxProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-semibold"
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint === undefined ? undefined : hintId}
          className="size-5 shrink-0 cursor-pointer accent-accent"
          {...input}
        />
        {label}
      </label>
      {hint === undefined ? null : (
        <p id={hintId} className="pl-8 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
