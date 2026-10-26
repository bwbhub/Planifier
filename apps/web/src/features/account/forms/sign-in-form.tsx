"use client";

import { signInInputSchema } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import Link from "next/link";
import type { SubmitEvent } from "react";

import { ROUTES } from "@/lib/routes";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useSignIn } from "../queries/auth.queries";
import { useFormValidation } from "../utils/use-form-validation";
import { useSessionRedirect } from "../utils/use-session-redirect";

const FIELDS = ["email", "password"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_ERRORS: Record<Field, string> = {
  email: "Vérifie ton adresse e-mail.",
  password: "Saisis ton mot de passe.",
};

export function SignInForm() {
  const redirectTo = useSessionRedirect();
  const signIn = useSignIn();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, signInInputSchema, {
      email: data.get("email"),
      password: data.get("password"),
    });
    if (input === null) return;
    signIn.mutate(input, {
      onSuccess: () => {
        redirectTo(ROUTES.home);
      },
    });
  }

  const errorOf = (field: Field) => (invalid.has(field) ? FIELD_ERRORS[field] : undefined);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        autoComplete="current-password"
        required
        error={errorOf("password")}
      />
      <Link
        href={ROUTES.forgotPassword}
        className="inline-flex min-h-11 items-center self-end text-sm font-semibold text-accent-text underline"
      >
        Mot de passe oublié ?
      </Link>
      {signIn.isError ? <AuthErrorAlert error={signIn.error} /> : null}
      <Button type="submit" disabled={signIn.isPending}>
        {signIn.isPending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
