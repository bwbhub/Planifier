"use client";

import { signInInputSchema } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";

import { ROUTES } from "@/lib/routes";

import { useSignIn } from "../queries/auth.queries";
import { authErrorMessage } from "../utils/auth-error-message";
import { focusFirstInvalid, type InvalidFields, invalidFieldsOf } from "./invalid-fields";

const FIELDS = ["email", "password"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_ERRORS: Record<Field, string> = {
  email: "Vérifie ton adresse e-mail.",
  password: "Saisis ton mot de passe.",
};

export function SignInForm() {
  const router = useRouter();
  const signIn = useSignIn();
  const [invalid, setInvalid] = useState<InvalidFields<Field>>(new Set());

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = signInInputSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    if (!parsed.success) {
      const fields = invalidFieldsOf(parsed.error, FIELDS);
      setInvalid(fields);
      focusFirstInvalid(form, FIELDS, fields);
      return;
    }
    setInvalid(new Set());
    signIn.mutate(parsed.data, {
      onSuccess: () => {
        router.replace(ROUTES.home);
        router.refresh();
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
      {signIn.isError ? (
        <p role="alert" className="text-sm text-accent-text">
          {authErrorMessage(signIn.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={signIn.isPending}>
        {signIn.isPending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
