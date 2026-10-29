"use client";

import {
  createTaskInputSchema,
  type TaskOutput,
  updateTaskInputSchema,
} from "@planifier/api-contract";
import {
  RECURRENCE_MAX_INTERVAL,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "@planifier/constants/todo";
import { Button } from "@planifier/ui/components/button";
import { ChoiceGroup } from "@planifier/ui/components/choice-group";
import { TextAreaField } from "@planifier/ui/components/text-area-field";
import { TextField } from "@planifier/ui/components/text-field";
import type { SubmitEvent } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { useCreateTask, useUpdateTask } from "../queries/todo.queries";
import { recurrenceFromForm, REPEAT_OPTIONS } from "../utils/recurrence";

const FIELDS = ["title", "description", "dueDate", "recurrence"] as const;
type Field = (typeof FIELDS)[number];

const TITLE_ERROR = `Donne un titre à la tâche, ${String(TASK_TITLE_MAX_LENGTH)} caractères au plus.`;
const DESCRIPTION_ERROR = `${String(TASK_DESCRIPTION_MAX_LENGTH)} caractères au plus.`;
const DUE_DATE_ERROR = "Choisis un jour valide, ou laisse vide.";
const INTERVAL_ERROR = `Un nombre entier de 1 à ${String(RECURRENCE_MAX_INTERVAL)}.`;

const COPY = {
  create: { title: "Nouvelle tâche", placeholder: "Ex. : acheter du pain", submit: "Ajouter" },
  subtask: { title: "Nouvelle sous-tâche", placeholder: "Ex. : du pain", submit: "Ajouter" },
  edit: { title: "Titre", placeholder: undefined, submit: "Enregistrer" },
} as const;

/** Champ facultatif laissé vide : `null`. */
function optionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Saisie à la chaîne : le formulaire se vide et le titre reprend le focus. */
function resetForNext(form: HTMLFormElement) {
  form.reset();
  const title = form.elements.namedItem("title");
  if (title instanceof HTMLInputElement) title.focus();
}

interface TaskDetailsProps {
  task: TaskOutput | undefined;
  invalid: ReadonlySet<Field>;
}

/** Champs rangés dans les détails repliables (le titre reste toujours visible). */
const DETAIL_FIELDS: readonly Field[] = ["description", "dueDate", "recurrence"];

/** Repliés tant que les détails sont vides et sans erreur. */
function detailsOpen({ task, invalid }: TaskDetailsProps): boolean {
  if (DETAIL_FIELDS.some((field) => invalid.has(field))) return true;
  if (task === undefined) return false;
  return [task.description, task.dueDate, task.recurrence].some((value) => value !== null);
}

/** Répétition (ADR 0017) : rythme, puis intervalle (« 2 » avec « Chaque semaine » : toutes les deux semaines). */
function RecurrenceFields({ task, invalid }: TaskDetailsProps) {
  return (
    <>
      <ChoiceGroup
        legend="Répéter"
        name="repeat"
        options={REPEAT_OPTIONS}
        defaultValue={task?.recurrence?.frequency ?? "NONE"}
      />
      <TextField
        label="Intervalle"
        name="interval"
        type="number"
        inputMode="numeric"
        min={1}
        max={RECURRENCE_MAX_INTERVAL}
        defaultValue={task?.recurrence?.interval ?? 1}
        hint="2 avec « Chaque semaine » : toutes les deux semaines. Sans effet si la tâche ne se répète pas."
        error={invalid.has("recurrence") ? INTERVAL_ERROR : undefined}
      />
    </>
  );
}

/** Description, échéance et répétition, facultatives. */
function TaskDetails({ task, invalid }: TaskDetailsProps) {
  return (
    <details open={detailsOpen({ task, invalid })}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted">
        Description, échéance, répétition (facultatives)
      </summary>
      <div className="flex flex-col gap-3 pt-2">
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={task?.description ?? undefined}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          error={invalid.has("description") ? DESCRIPTION_ERROR : undefined}
        />
        <TextField
          label="Échéance"
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? undefined}
          error={invalid.has("dueDate") ? DUE_DATE_ERROR : undefined}
        />
        <RecurrenceFields task={task} invalid={invalid} />
      </div>
    </details>
  );
}

interface TaskFormProps {
  listId: string;
  /** Tâche à modifier ; absente : création (le formulaire se vide après chaque ajout). */
  task?: TaskOutput | undefined;
  /** Création d'une sous-tâche de cette tâche. */
  parentId?: string | undefined;
  /** Fin de la modification, ou abandon de l'ajout de sous-tâches ; absent : formulaire toujours ouvert. */
  onDone?: (() => void) | undefined;
}

function copyOf(task: TaskOutput | undefined, parentId: string | undefined) {
  if (task !== undefined) return COPY.edit;
  return parentId === undefined ? COPY.create : COPY.subtask;
}

/** Un seul formulaire pour créer une tâche et la modifier : titre obligatoire, détails facultatifs. */
export function TaskForm({ listId, task, parentId, onDone }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const mutation = task === undefined ? createTask : updateTask;
  const copy = copyOf(task, parentId);
  const { invalid, validate } = useFormValidation(FIELDS);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = data.get("title");
    const description = optionalText(data.get("description"));
    const dueDate = optionalText(data.get("dueDate"));
    const recurrence = recurrenceFromForm(data);
    if (task === undefined) {
      // Création : un champ vide est absent.
      const input = validate(form, createTaskInputSchema, {
        listId,
        parentId,
        title,
        description: description ?? undefined,
        dueDate: dueDate ?? undefined,
        recurrence: recurrence ?? undefined,
      });
      if (input !== null)
        createTask.mutate(input, {
          onSuccess: () => {
            resetForNext(form);
          },
        });
      return;
    }
    // Modification : un champ vidé vaut `null`, il est effacé.
    const input = validate(form, updateTaskInputSchema, {
      taskId: task.id,
      version: task.version,
      title,
      description,
      dueDate,
      recurrence,
    });
    if (input !== null) updateTask.mutate(input, { onSuccess: () => onDone?.() });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        label={copy.title}
        name="title"
        placeholder={copy.placeholder}
        defaultValue={task?.title}
        maxLength={TASK_TITLE_MAX_LENGTH}
        required
        autoFocus={onDone !== undefined}
        error={invalid.has("title") ? TITLE_ERROR : undefined}
      />
      <TaskDetails task={task} invalid={invalid} />
      {mutation.isError ? <TodoErrorAlert error={mutation.error} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {copy.submit}
        </Button>
        {onDone === undefined ? null : (
          <Button variant="secondary" onClick={onDone}>
            {task === undefined ? "Fermer" : "Annuler"}
          </Button>
        )}
      </div>
    </form>
  );
}
