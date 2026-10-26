"use client";

import { signUpInputSchema } from "@planifier/api-contract";
import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@planifier/constants/account";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { ROUTES } from "@/lib/routes";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useSignUp } from "../queries/auth.queries";
import { useFormValidation } from "../utils/use-form-validation";
import { useSessionRedirect } from "../utils/use-session-redirect";

const FIELDS = ["name", "email", "password"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_ERRORS: Record<Field, string> = {
  name: `Indique un nom, ${String(DISPLAY_NAME_MAX_LENGTH)} caractères au plus.`,
  email: "Vérifie ton adresse e-mail.",
  password: `Choisis un mot de passe de ${String(PASSWORD_MIN_LENGTH)} à ${String(PASSWORD_MAX_LENGTH)} caractères.`,
};

export function SignUpForm() {
  const redirectTo = useSessionRedirect();
  const signUp = useSignUp();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, signUpInputSchema, {
      name: data.get("name"),
      email: data.get("email"),
      password: data.get("password"),
    });
    if (input === null) return;
    signUp.mutate(input, {
      onSuccess: () => {
        redirectTo(ROUTES.home);
      },
    });
  }

  const errorOf = (field: Field) => (invalid.has(field) ? FIELD_ERRORS[field] : undefined);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Ton nom"
        name="name"
        autoComplete="nickname"
        hint="C'est ainsi que les autres te verront."
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        required
        error={errorOf("name")}
      />
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={errorOf("email")}
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={`${String(PASSWORD_MIN_LENGTH)} caractères au moins.`}
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={errorOf("password")}
      />
      {signUp.isError ? <AuthErrorAlert error={signUp.error} /> : null}
      <Button type="submit" disabled={signUp.isPending}>
        {signUp.isPending ? "Création du compte…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
