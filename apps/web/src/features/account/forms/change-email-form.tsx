"use client";

import { changeEmailInputSchema } from "@planifier/api-contract";
import { PASSWORD_MAX_LENGTH } from "@planifier/constants/account";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { MailSentNotice } from "../atoms/mail-sent-notice";
import { useChangeEmail } from "../queries/auth.queries";
import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

const FIELDS = ["newEmail", "currentPassword"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_ERRORS: Record<Field, string> = {
  newEmail: "Vérifie ta nouvelle adresse e-mail.",
  currentPassword: "Saisis ton mot de passe actuel.",
};

/** Adresse du compte : change seulement après le clic sur le lien reçu à la nouvelle adresse. */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const changeEmail = useChangeEmail();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, changeEmailInputSchema, {
      newEmail: data.get("newEmail"),
      currentPassword: data.get("currentPassword"),
    });
    if (input !== null) changeEmail.mutate(input);
  }

  // Même message que l'adresse ait déjà un compte ou non.
  if (changeEmail.isSuccess) {
    return (
      <MailSentNotice title="Regarde ta nouvelle boîte mail">
        Un lien vient de partir à {changeEmail.variables.newEmail}. Ton adresse ne change qu'après
        le clic ; d'ici là, tu te connectes avec {currentEmail}.
      </MailSentNotice>
    );
  }

  const errorOf = (field: Field) => (invalid.has(field) ? FIELD_ERRORS[field] : undefined);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Nouvelle adresse e-mail"
        name="newEmail"
        type="email"
        autoComplete="email"
        required
        error={errorOf("newEmail")}
      />
      <TextField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={errorOf("currentPassword")}
      />
      {changeEmail.isError ? <AuthErrorAlert error={changeEmail.error} /> : null}
      <Button type="submit" variant="secondary" disabled={changeEmail.isPending}>
        {changeEmail.isPending ? "Envoi…" : "Changer l'adresse"}
      </Button>
    </form>
  );
}
