"use client";

import { resetPasswordInputSchema } from "@planifier/api-contract";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@planifier/constants/account";
import { Button, buttonClassName } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import Link from "next/link";
import type { SubmitEvent } from "react";

import { ROUTES } from "@/lib/routes";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useResetPassword } from "../queries/auth.queries";
import { useFormValidation } from "../utils/use-form-validation";

const FIELDS = ["newPassword"] as const;

/** Nouveau mot de passe, avec le jeton du lien reçu par e-mail. */
export function ResetPasswordForm({ token }: { token: string }) {
  const reset = useResetPassword();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = validate(form, resetPasswordInputSchema, {
      newPassword: new FormData(form).get("newPassword"),
      token,
    });
    if (input !== null) reset.mutate(input);
  }

  if (reset.isSuccess) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p>Ton mot de passe est changé. Tes appareils connectés ont été déconnectés.</p>
        <Link href={ROUTES.signIn} className={buttonClassName("primary")}>
          Me connecter
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint={`${String(PASSWORD_MIN_LENGTH)} caractères au moins.`}
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={
          invalid.has("newPassword")
            ? `Choisis un mot de passe de ${String(PASSWORD_MIN_LENGTH)} à ${String(PASSWORD_MAX_LENGTH)} caractères.`
            : undefined
        }
      />
      {reset.isError ? <AuthErrorAlert error={reset.error} /> : null}
      <Button type="submit" disabled={reset.isPending}>
        {reset.isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
