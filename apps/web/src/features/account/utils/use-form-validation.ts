import { useState } from "react";
import type { z } from "zod";

import { focusFirstInvalid, type InvalidFields, invalidFieldsOf } from "./form-validation";

/**
 * Validation d'un formulaire avant envoi : `validate` rend l'entrée parsée, ou `null` après avoir marqué les champs
 * refusés (`invalid`) et donné le focus au premier.
 */
export function useFormValidation<TField extends string>(fields: readonly TField[]) {
  const [invalid, setInvalid] = useState<InvalidFields<TField>>(new Set());

  function validate<TOutput>(
    form: HTMLFormElement,
    schema: z.ZodType<TOutput>,
    values: Record<TField, unknown> & Record<string, unknown>,
  ): TOutput | null {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const refused = invalidFieldsOf(parsed.error, fields);
      setInvalid(refused);
      focusFirstInvalid(form, fields, refused);
      return null;
    }
    setInvalid(new Set());
    return parsed.data;
  }

  return { invalid, validate };
}
