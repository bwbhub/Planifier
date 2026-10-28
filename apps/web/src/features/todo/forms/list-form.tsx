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

import { useFormValidation } from "@/features/_shared/utils/use-form-validation";

import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { useCreateList, useUpdateList } from "../queries/todo.queries";
import { TINT_OPTIONS } from "../utils/list-tint";

const FIELDS = ["name", "tint"] as const;

const NAME_ERROR = `Donne un nom à la liste, ${String(TODO_LIST_NAME_MAX_LENGTH)} caractères au plus.`;

interface ListFormProps {
  /** Liste à modifier ; absente : création. */
  list?: TodoListOutput | undefined;
  onSaved: (list: TodoListOutput) => void;
  onCancel: () => void;
}

/** Un seul formulaire pour créer une liste et la modifier (nom, teinte). */
export function ListForm({ list, onSaved, onCancel }: ListFormProps) {
  const createList = useCreateList();
  const updateList = useUpdateList();
  const mutation = list === undefined ? createList : updateList;
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = { name: data.get("name"), tint: data.get("tint") };
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
