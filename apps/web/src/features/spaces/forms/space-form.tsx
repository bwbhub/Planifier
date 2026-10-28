"use client";

import {
  createSpaceInputSchema,
  type SpaceOutput,
  updateSpaceInputSchema,
} from "@planifier/api-contract";
import { type AppModule, MODULES, SPACE_NAME_MAX_LENGTH } from "@planifier/constants/spaces";
import { Button } from "@planifier/ui/components/button";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { TextField } from "@planifier/ui/components/text-field";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";
import { COMMON_LABELS } from "@/lib/labels";
import { spaceRoute } from "@/lib/routes";

import { SectionTitle } from "../atoms/setting-row";
import { DEFAULT_SPACE_MODULES } from "../constants";
import { SPACE_LABELS, SPACE_MODULE_LABELS, VISIBILITY_LABELS } from "../labels";
import { useCreateSpace, useUpdateSpace } from "../queries/spaces.queries";
import { spaceConflictReason, spaceErrorMessage } from "../utils/space-error-message";

const FIELDS = ["name"] as const;

const NAME_ERROR = `Indique un nom, ${String(SPACE_NAME_MAX_LENGTH)} caractères au plus.`;

interface SpaceFormProps {
  /** Espace à modifier ; absent, le formulaire en crée un. */
  space?: SpaceOutput;
  /** Relire l'Espace après un refus `STALE_VERSION` (modification concurrente). */
  onReload?: () => void;
}

/** Création et réglages d'un Espace : nom, modules et, une fois créé, visibilité. */
export function SpaceForm({ space, onReload }: SpaceFormProps) {
  const router = useRouter();
  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();
  const mutation = space === undefined ? createSpace : updateSpace;
  const { invalid, validate } = useFormValidation(FIELDS);
  const selected = new Set<AppModule>(space?.modules ?? DEFAULT_SPACE_MODULES);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = { name: data.get("name"), modules: data.getAll("modules") };

    if (space === undefined) {
      const input = validate(form, createSpaceInputSchema, values);
      if (input === null) return;
      createSpace.mutate(input, {
        onSuccess: (created) => {
          router.push(spaceRoute(created.id));
        },
      });
      return;
    }

    const input = validate(form, updateSpaceInputSchema, {
      ...values,
      spaceId: space.id,
      version: space.version,
      restrictVisibility: data.get("restrictVisibility") === "on",
    });
    if (input === null) return;
    updateSpace.mutate(input, {
      onSuccess: () => {
        router.push(spaceRoute(space.id));
      },
    });
  }

  const stale = spaceConflictReason(mutation.error) === "STALE_VERSION";

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        label="Nom"
        name="name"
        hint={`Visible par les membres. ${String(SPACE_NAME_MAX_LENGTH)} caractères au plus.`}
        defaultValue={space?.name}
        maxLength={SPACE_NAME_MAX_LENGTH}
        required
        autoComplete="off"
        error={invalid.has("name") ? NAME_ERROR : undefined}
      />

      <ModulesFieldset selected={selected} />

      {space === undefined ? null : (
        <>
          <SectionTitle>{VISIBILITY_LABELS.title}</SectionTitle>
          <div className="rounded-card bg-surface px-4.5 py-3">
            <Checkbox
              name="restrictVisibility"
              label={VISIBILITY_LABELS.toggle}
              hint="Décoché : chaque membre voit tout ce qui est dans l'Espace. Coché : chacun voit seulement ce qu'on partage avec lui."
              defaultChecked={space.restrictVisibility}
            />
          </div>
        </>
      )}

      {mutation.isError ? (
        <SubmitError error={mutation.error} onReload={stale ? onReload : undefined} />
      ) : null}

      <Button type="submit" className="mt-3" disabled={mutation.isPending}>
        {submitLabel(space === undefined, mutation.isPending)}
      </Button>
    </form>
  );
}

function submitLabel(creating: boolean, pending: boolean): string {
  if (creating) return pending ? COMMON_LABELS.creating : "Créer l'Espace";
  return pending ? COMMON_LABELS.saving : COMMON_LABELS.save;
}

/** Modules activés pour l'Espace : cases décochables, rien n'est imposé. */
function ModulesFieldset({ selected }: { selected: ReadonlySet<AppModule> }) {
  return (
    <>
      <fieldset>
        <legend className="mx-1.5 mt-2.5 mb-3 text-sm font-semibold text-muted">
          {SPACE_LABELS.modules}
        </legend>
        <div className="flex flex-col gap-1 rounded-card bg-surface px-4.5 py-3">
          {MODULES.map((module) => (
            <Checkbox
              key={module}
              name="modules"
              value={module}
              label={SPACE_MODULE_LABELS[module].label}
              hint={SPACE_MODULE_LABELS[module].hint}
              defaultChecked={selected.has(module)}
            />
          ))}
        </div>
      </fieldset>
      <p className="mx-0.5 text-sm text-muted">
        Tu pourras en ajouter ou en retirer plus tard. Retirer un module ne supprime rien.
      </p>
    </>
  );
}

/** Refus d'enregistrer ; après une modification concurrente, relire l'Espace avant de recommencer. */
function SubmitError({ error, onReload }: { error: unknown; onReload: (() => void) | undefined }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-card bg-surface p-4.5">
      <p className="leading-relaxed">{spaceErrorMessage(error)}</p>
      {onReload === undefined ? null : (
        <Button variant="secondary" onClick={onReload}>
          Recharger l&apos;Espace
        </Button>
      )}
    </div>
  );
}
