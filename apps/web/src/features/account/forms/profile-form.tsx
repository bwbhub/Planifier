"use client";

import { updateProfileInputSchema } from "@planifier/api-contract";
import { DISPLAY_NAME_MAX_LENGTH, type ThemePreference } from "@planifier/constants/account";
import { Button } from "@planifier/ui/components/button";
import { ChoiceGroup } from "@planifier/ui/components/choice-group";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useUpdateProfile } from "../queries/auth.queries";
import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

const FIELDS = ["name", "preferredTheme"] as const;

const NAME_ERROR = `Indique un nom, ${String(DISPLAY_NAME_MAX_LENGTH)} caractères au plus.`;

const THEME_OPTIONS = [
  { value: "SYSTEM", label: "Comme l'appareil" },
  { value: "LIGHT", label: "Clair" },
  { value: "DARK", label: "Nuit" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

interface ProfileFormProps {
  name: string;
  preferredTheme: ThemePreference;
}

export function ProfileForm({ name, preferredTheme }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, updateProfileInputSchema, {
      name: data.get("name"),
      preferredTheme: data.get("preferredTheme"),
    });
    if (input === null) return;
    updateProfile.mutate(input);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Ton nom"
        name="name"
        autoComplete="nickname"
        hint="C'est ainsi que les autres te verront."
        defaultValue={name}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        required
        error={invalid.has("name") ? NAME_ERROR : undefined}
      />
      <ChoiceGroup
        legend="Thème"
        name="preferredTheme"
        options={THEME_OPTIONS}
        defaultValue={preferredTheme}
      />
      {updateProfile.isError ? <AuthErrorAlert error={updateProfile.error} /> : null}
      {updateProfile.isSuccess ? (
        <p role="status" className="text-sm text-muted">
          C&apos;est enregistré.
        </p>
      ) : null}
      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
