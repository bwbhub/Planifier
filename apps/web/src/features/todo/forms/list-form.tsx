"use client";

import {
  createListInputSchema,
  type TodoListOutput,
  updateListInputSchema,
} from "@planifier/api-contract";
import { TODO_LIST_NAME_MAX_LENGTH } from "@planifier/constants/todo";
import { Button } from "@planifier/ui/components/button";
import { ChoiceGroup } from "@planifier/ui/components/choice-group";
import { TextField } from "@planifier/ui/components/text-field";
import { type SubmitEvent, useState } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { useCreateList, useSharingSpaces, useUpdateList } from "../queries/todo.queries";
import { TINT_OPTIONS } from "@/features/_shared/utils/tints";
import {
  PERSONAL,
  sharedSpace,
  sharingChoices,
  sharingFields,
  type SharingLevel,
} from "../utils/sharing-choices";
import { useListNameSuggestion } from "../utils/use-list-name-suggestion";

const FIELDS = ["name", "tint"] as const;

const NAME_ERROR = `Donne un nom à la liste, ${String(TODO_LIST_NAME_MAX_LENGTH)} caractères au plus.`;

const SHARING_LEVEL_OPTIONS: readonly { value: SharingLevel; label: string }[] = [
  { value: "WRITE", label: "Modifier et cocher" },
  { value: "READ", label: "Seulement voir" },
];

interface SharingFieldsProps {
  choices: readonly { id: string; name: string }[];
  current: { id: string } | null;
  level: SharingLevel;
}

/** « Partager avec » et, un Espace choisi, ce que ses membres peuvent faire. */
function SharingFields({ choices, current, level }: SharingFieldsProps) {
  const [spaceChosen, setSpaceChosen] = useState(current !== null);
  return (
    <div className="flex flex-col gap-3">
      <ChoiceGroup
        legend="Partager avec"
        name="spaceId"
        options={[
          { value: PERSONAL, label: "Personne" },
          ...choices.map(({ id, name }) => ({ value: id, label: name })),
        ]}
        defaultValue={current?.id ?? PERSONAL}
        onValueChange={(value) => {
          setSpaceChosen(value !== PERSONAL);
        }}
      />
      {spaceChosen ? (
        <div className="flex flex-col gap-1.5">
          <ChoiceGroup
            legend="Ses membres peuvent"
            name="sharingLevel"
            options={SHARING_LEVEL_OPTIONS}
            defaultValue={level}
          />
          <p className="text-sm text-muted">
            « Modifier et cocher » : la liste appartient à l&apos;Espace, ses membres y font tout. «
            Seulement voir » : elle reste à toi, personne d&apos;autre n&apos;y écrit.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Partage de la liste : personne (liste perso) ou un Espace (`sharingChoices`) ; rien pour qui n'est pas propriétaire
 * de la liste. Sans les Espaces (chargement, échec), le champ manque et le partage de la liste ne change pas.
 */
function SharingChoice({ list }: { list: TodoListOutput | undefined }) {
  const spaces = useSharingSpaces();
  if (list?.can.share === false) return null;
  if (spaces.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        Chargement de tes Espaces…
      </p>
    );
  }
  if (spaces.isError) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 text-sm">
        <p role="alert">
          Tes Espaces ne se chargent pas : le partage de la liste ne change pas pour l&apos;instant.
        </p>
        <Button variant="ghost" size="sm" onClick={() => void spaces.refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }
  const current = list === undefined ? null : sharedSpace(list);
  const choices = sharingChoices(spaces.data.items, current);
  if (choices.length === 0) {
    return (
      <p className="text-sm text-muted">
        Pour partager une liste, active Todo dans un de tes Espaces : tous ses membres pourront la
        voir, et y ajouter et cocher des tâches si tu le choisis.
      </p>
    );
  }
  return (
    <SharingFields
      choices={choices}
      current={current}
      level={list?.readOnlySpace ? "READ" : "WRITE"}
    />
  );
}

/** Champs de partage du formulaire ; aucun si le choix n'est pas proposé. */
function sharingFromForm(data: FormData, list: TodoListOutput | undefined) {
  const chosen = data.get("spaceId");
  if (typeof chosen !== "string") return {};
  return sharingFields(chosen, data.get("sharingLevel") === "READ" ? "READ" : "WRITE", list);
}

interface ListFormProps {
  /** Liste à modifier ; absente : création. */
  list?: TodoListOutput | undefined;
  onSaved: (list: TodoListOutput) => void;
  onCancel: () => void;
}

/** Un seul formulaire pour créer une liste et la modifier (nom, teinte ; partage, pour son propriétaire). */
export function ListForm({ list, onSaved, onCancel }: ListFormProps) {
  const createList = useCreateList();
  const updateList = useUpdateList();
  const mutation = list === undefined ? createList : updateList;
  const { invalid, validate } = useFormValidation(FIELDS);
  const suggestName = useListNameSuggestion();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: data.get("name"),
      tint: data.get("tint"),
      ...sharingFromForm(data, list),
    };
    if (list === undefined) {
      const input = validate(form, createListInputSchema, values);
      if (input !== null) createList.mutate(input, { onSuccess: onSaved });
      return;
    }
    const input = validate(form, updateListInputSchema, {
      ...values,
      listId: list.id,
      version: list.version,
    });
    if (input !== null) updateList.mutate(input, { onSuccess: onSaved });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      // Création seulement : un nom déjà choisi ne change pas avec l'Espace.
      onChange={list === undefined ? suggestName : undefined}
      className="flex flex-col gap-4"
    >
      <TextField
        label="Nom de la liste"
        name="name"
        defaultValue={list?.name}
        maxLength={TODO_LIST_NAME_MAX_LENGTH}
        required
        autoFocus
        error={invalid.has("name") ? NAME_ERROR : undefined}
      />
      <ChoiceGroup
        legend="Teinte"
        name="tint"
        options={TINT_OPTIONS}
        defaultValue={list?.tint ?? "general"}
      />
      <SharingChoice list={list} />
      {mutation.isError ? <TodoErrorAlert error={mutation.error} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {list === undefined ? "Créer la liste" : "Enregistrer"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
