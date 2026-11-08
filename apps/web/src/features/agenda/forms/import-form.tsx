"use client";

import { createImportInputSchema } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

import { useCreateImport } from "../queries/imports.queries";
import { importErrorMessage } from "../utils/import-error-message";

const FIELDS = ["label", "url"] as const;

const LABEL_ERROR = "Donne un nom à cet agenda, 60 caractères au plus.";
const URL_ERROR = "Colle le lien privé de l'agenda.";

/** Un seul formulaire d'import : un nom pour le reconnaître, le lien privé. Le lien est lu tout de suite. */
export function ImportForm() {
  const createImport = useCreateImport();
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = validate(form, createImportInputSchema, {
      label: data.get("label"),
      url: data.get("url"),
    });
    if (input === null) return;
    createImport.mutate(input, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Importer un agenda"
      className="flex flex-col gap-3 rounded-card bg-surface p-4.5"
    >
      <TextField
        label="Nom"
        name="label"
        placeholder="Ex. : Google perso"
        maxLength={60}
        required
        error={invalid.has("label") ? LABEL_ERROR : undefined}
      />
      <TextField
        label="Lien privé"
        name="url"
        type="url"
        hint="Il reste secret : il n'est plus jamais affiché en entier."
        placeholder="https://calendar.google.com/…/basic.ics"
        autoComplete="off"
        required
        error={invalid.has("url") ? URL_ERROR : undefined}
      />
      {createImport.isError ? (
        <p role="alert" className="text-sm text-accent-text">
          {importErrorMessage(createImport.error)}
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={createImport.isPending}>
          {createImport.isPending ? "Lecture de l'agenda…" : "Importer"}
        </Button>
      </div>
    </form>
  );
}
