"use client";

import { requestPasswordResetInputSchema } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { MailSentNotice } from "../atoms/mail-sent-notice";
import { useRequestPasswordReset } from "../queries/auth.queries";
import { useFormValidation } from "../utils/use-form-validation";

const FIELDS = ["email"] as const;

export function ForgotPasswordForm() {
  const request = useRequestPasswordReset();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = validate(form, requestPasswordResetInputSchema, {
      email: new FormData(form).get("email"),
    });
    if (input !== null) request.mutate(input);
  }

  // Même message qu'un compte existe ou non.
  if (request.isSuccess) {
    return (
      <MailSentNotice title="Regarde ta boîte mail">
        Si un compte existe avec {request.variables.email}, un lien pour choisir un nouveau mot de
        passe vient de partir.
      </MailSentNotice>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={invalid.has("email") ? "Vérifie ton adresse e-mail." : undefined}
      />
      {request.isError ? <AuthErrorAlert error={request.error} /> : null}
      <Button type="submit" disabled={request.isPending}>
        {request.isPending ? "Envoi…" : "Recevoir un lien"}
      </Button>
    </form>
  );
}
