"use client";

import { changePasswordInputSchema } from "@planifier/api-contract";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@planifier/constants/account";
import { Button } from "@planifier/ui/components/button";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useChangePassword } from "../queries/auth.queries";
import { useFormValidation } from "@/features/_shared/utils/use-form-validation";

const FIELDS = ["currentPassword", "newPassword"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_ERRORS: Record<Field, string> = {
  currentPassword: "Saisis ton mot de passe actuel.",
  newPassword: `Choisis un mot de passe de ${String(PASSWORD_MIN_LENGTH)} à ${String(PASSWORD_MAX_LENGTH)} caractères.`,
};

export function PasswordForm() {
  const changePassword = useChangePassword();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, changePasswordInputSchema, {
      currentPassword: data.get("currentPassword"),
      newPassword: data.get("newPassword"),
      revokeOtherSessions: data.get("revokeOtherSessions") === "on",
    });
    if (input === null) return;
    changePassword.mutate(input, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  const errorOf = (field: Field) => (invalid.has(field) ? FIELD_ERRORS[field] : undefined);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={errorOf("currentPassword")}
      />
      <TextField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint={`${String(PASSWORD_MIN_LENGTH)} caractères au moins.`}
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={errorOf("newPassword")}
      />
      <Checkbox
        label="Déconnecter mes autres appareils"
        name="revokeOtherSessions"
        hint="Utile si tu penses que quelqu'un d'autre connaît ton mot de passe."
      />
      {changePassword.isError ? <AuthErrorAlert error={changePassword.error} /> : null}
      {changePassword.isSuccess ? (
        <p role="status" className="text-sm text-muted">
          {changePassword.variables.revokeOtherSessions
            ? "Mot de passe changé. Tes autres appareils ont été déconnectés."
            : "Mot de passe changé."}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
        {changePassword.isPending ? "Changement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
