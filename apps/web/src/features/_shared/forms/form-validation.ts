import type { z } from "zod";

/** Champs refusés par la validation, dans l'ordre du formulaire (le premier reçoit le focus). */
export type InvalidFields<TField extends string> = ReadonlySet<TField>;

/** Champs du formulaire en erreur d'après un refus Zod ; les autres chemins sont ignorés. */
export function invalidFieldsOf<TField extends string>(
  error: z.ZodError,
  fields: readonly TField[],
): InvalidFields<TField> {
  const paths = new Set(error.issues.map((issue) => issue.path[0]));
  return new Set(fields.filter((field) => paths.has(field)));
}

/** Donne le focus au premier champ en erreur (navigation clavier et lecteur d'écran). */
export function focusFirstInvalid<TField extends string>(
  form: HTMLFormElement,
  fields: readonly TField[],
  invalid: InvalidFields<TField>,
) {
  const first = fields.find((field) => invalid.has(field));
  if (first === undefined) return;
  const element = form.elements.namedItem(first);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
    element.focus();
}
