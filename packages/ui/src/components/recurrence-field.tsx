"use client";

import { type ReactNode, useState } from "react";

import { type ChoiceOption, ChoiceGroup } from "./choice-group";

export interface RecurrenceFieldProps {
  legend: string;
  /** Nom du bouton radio dans le `FormData` : vaut la valeur du préréglage choisi, ou `customValue`. */
  name: string;
  /** Préréglages, dans l'ordre (le premier : « Jamais » ou équivalent). */
  presets: readonly ChoiceOption<string>[];
  /** Dernier choix, qui ouvre le panneau : « Personnalisée… ». */
  custom: ChoiceOption<string>;
  defaultValue: string;
  /** Champs du choix personnalisé, montrés seulement quand il est choisi (absents du `FormData` sinon). */
  children?: ReactNode;
  className?: string | undefined;
}

/**
 * Choix d'une répétition : quelques préréglages en pastilles, puis « Personnalisée… » qui montre un panneau de champs
 * fournis par l'appelant. Sans métier : les préréglages, les mots et les champs viennent de lui.
 */
export function RecurrenceField({
  legend,
  name,
  presets,
  custom,
  defaultValue,
  children,
  className,
}: RecurrenceFieldProps) {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-3">
      <ChoiceGroup
        legend={legend}
        name={name}
        options={[...presets, custom]}
        defaultValue={defaultValue}
        onValueChange={setSelected}
        className={className}
      />
      {selected === custom.value ? children : null}
    </div>
  );
}
