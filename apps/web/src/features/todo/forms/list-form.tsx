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
import type { SubmitEvent } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { useCreateList, useSharingSpaces, useUpdateList } from "../queries/todo.queries";
import { TINT_OPTIONS } from "../utils/list-tint";
import { sharingChoices } from "../utils/sharing-choices";

const FIELDS = ["name", "tint"] as const;

const NAME_ERROR = `Donne un nom à la liste, ${String(TODO_LIST_NAME_MAX_LENGTH)} caractères au plus.`;

/** Valeur du choix « Partager avec » pour une liste perso. */
const PERSONAL = "";

/**
 * « Partager avec » : personne (liste perso) ou un Espace (`sharingChoices`) ; rien pour qui n'est pas propriétaire
 * de la liste. Sans les Espaces (chargement, échec), le champ manque et l'Espace de la liste ne change pas.
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
  const current = list?.space ?? null;
  const choices = sharingChoices(spaces.data.items, current);
  if (choices.length === 0) {
    return (
      <p className="text-sm text-muted">
        Pour partager une liste, active Todo dans un de tes Espaces : tous ses membres pourront y
        ajouter et cocher des tâches.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <ChoiceGroup
        legend="Partager avec"
        name="spaceId"
        options={[
          { value: PERSONAL, label: "Personne" },
          ...choices.map(({ id, name }) => ({ value: id, label: name })),
        ]}
        defaultValue={current?.id ?? PERSONAL}
      />
      <p className="text-sm text-muted">
        Partagée avec un Espace, la liste est visible par tous ses membres, qui peuvent y ajouter et
        cocher des tâches.
      </p>
    </div>
  );
}

/**
 * Champ `spaceId` à envoyer : rien si le choix n'est pas proposé ou inchangé (changer d'Espace demande d'être
 * propriétaire de la liste) ; à la création, rien pour une liste perso ; en modification, `null` la rend perso.
 */
function spaceField(data: FormData, list: TodoListOutput | undefined) {
  const value = data.get("spaceId");
  if (typeof value !== "string") return {};
  const spaceId = value === PERSONAL ? null : value;
  if (list === undefined) return spaceId === null ? {} : { spaceId };
  return spaceId === (list.space?.id ?? null) ? {} : { spaceId };
}

interface ListFormProps {
  /** Liste à modifier ; absente : création. */
  list?: TodoListOutput | undefined;
  onSaved: (list: TodoListOutput) => void;
  onCancel: () => void;
}

/** Un seul formulaire pour créer une liste et la modifier (nom, teinte ; Espace, pour son propriétaire). */
export function ListForm({ list, onSaved, onCancel }: ListFormProps) {
  const createList = useCreateList();
  const updateList = useUpdateList();
  const mutation = list === undefined ? createList : updateList;
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = { name: data.get("name"), tint: data.get("tint"), ...spaceField(data, list) };
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
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
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
