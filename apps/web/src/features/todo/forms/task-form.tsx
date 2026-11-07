"use client";

import {
  createTaskInputSchema,
  type TaskOutput,
  updateTaskInputSchema,
} from "@planifier/api-contract";
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@planifier/constants/todo";
import { Button } from "@planifier/ui/components/button";
import { SelectField } from "@planifier/ui/components/select-field";
import { TextAreaField } from "@planifier/ui/components/text-area-field";
import { TextField } from "@planifier/ui/components/text-field";
import { useToast } from "@planifier/ui/components/toast";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { type SubmitEvent, useState } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";

import { COMMON_LABELS, TASK_LABELS } from "@/lib/labels";

import { DueFields } from "./due-fields";
import { RecurrenceFields } from "./recurrence-fields";
import { createValues, readTaskForm, updateValues } from "./task-form-values";
import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { TODO_LABELS } from "../labels";
import { useCreateTask, useListMembers, useUpdateTask } from "../queries/todo.queries";
import { assigneeOptions } from "../utils/assignees";
import { useListView } from "../utils/list-view";
import { todoErrorMessage } from "../utils/todo-error-message";

const FIELDS = ["title", "description", "dueDate", "dueTime", "recurrence"] as const;
type Field = (typeof FIELDS)[number];

const TITLE_ERROR = `Donne un titre à la tâche, ${String(TASK_TITLE_MAX_LENGTH)} caractères au plus.`;
const DESCRIPTION_ERROR = `${String(TASK_DESCRIPTION_MAX_LENGTH)} caractères au plus.`;
const DUE_DATE_ERROR = "Choisis un jour valide, ou laisse vide.";

const COPY = {
  create: { title: "Nouvelle tâche", placeholder: "Ex. : acheter du pain", submit: "Ajouter" },
  subtask: { title: "Nouvelle sous-tâche", placeholder: "Ex. : du pain", submit: "Ajouter" },
  edit: { title: "Titre", placeholder: undefined, submit: "Enregistrer" },
} as const;

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

interface AssigneeProps {
  listId: string;
  task: TaskOutput | undefined;
}

/** Erreur du jour d'échéance, ou de l'heure sans jour : les deux se lisent sous le champ du jour. */
function dueError(invalid: ReadonlySet<Field>): string | undefined {
  if (invalid.has("dueDate")) return DUE_DATE_ERROR;
  return invalid.has("dueTime") ? TODO_LABELS.timeNeedsDay : undefined;
}

/** Champs rangés dans les détails repliables (le titre reste toujours visible). */
const DETAIL_FIELDS: readonly Field[] = ["description", "dueDate", "dueTime", "recurrence"];

/** Repliés tant que les détails sont vides et sans erreur. */
function detailsOpen({ task, invalid }: TaskDetailsProps): boolean {
  if (DETAIL_FIELDS.some((field) => invalid.has(field))) return true;
  if (task === undefined) return false;
  return [task.description, task.dueDate, task.recurrence, task.assignee].some(
    (value) => value !== null,
  );
}

/** Assigné, liste partagée seulement. Tant que les personnes ne sont pas lues, le champ manque et rien ne change. */
function AssigneeField({ listId, task }: AssigneeProps) {
  const members = useListMembers(listId);
  if (members.data === undefined) {
    return members.isError ? (
      <LoadError
        message={todoErrorMessage(members.error)}
        retryLabel={COMMON_LABELS.retry}
        onRetry={() => void members.refetch()}
      />
    ) : (
      <ListSkeleton label={TODO_LABELS.loadingPeople} rows={1} />
    );
  }
  return (
    <SelectField
      label={TASK_LABELS.assignedTo}
      name="assigneeId"
      options={assigneeOptions(members.data.items, task?.assignee ?? null)}
      defaultValue={task?.assignee?.userId ?? ""}
    />
  );
}

/** Description, échéance, répétition et, liste partagée, assigné : facultatifs. */
function TaskDetails({ listId, task, invalid }: TaskDetailsProps & AssigneeProps) {
  const { shared } = useListView();
  return (
    <details open={detailsOpen({ task, invalid })}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted">
        {shared
          ? "Description, échéance, répétition, assignation (facultatives)"
          : "Description, échéance, répétition (facultatives)"}
      </summary>
      <div className="flex flex-col gap-3 pt-2">
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={task?.description ?? undefined}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          error={invalid.has("description") ? DESCRIPTION_ERROR : undefined}
        />
        <DueFields task={task} error={dueError(invalid)} />
        <RecurrenceFields task={task} intervalInvalid={invalid.has("recurrence")} />
        {shared ? <AssigneeField listId={listId} task={task} /> : null}
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
  /**
   * Création terminée : l'appelant prend la suite (fermer la feuille, annoncer l'ajout). Absent : le formulaire dit
   * « Tâche ajoutée. » et se vide pour la saisie suivante.
   */
  onCreated?: ((task: TaskOutput) => void) | undefined;
}

function copyOf(task: TaskOutput | undefined, parentId: string | undefined) {
  if (task !== undefined) return COPY.edit;
  return parentId === undefined ? COPY.create : COPY.subtask;
}

/** Un seul formulaire pour créer une tâche et la modifier : titre obligatoire, détails facultatifs. */
export function TaskForm({ listId, task, parentId, onDone, onCreated }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { notify } = useToast();
  const mutation = task === undefined ? createTask : updateTask;
  const copy = copyOf(task, parentId);
  const { invalid, validate } = useFormValidation(FIELDS);
  // Version lue à l'ouverture : les champs ne suivent pas les relectures, enregistrer après un changement venu
  // d'ailleurs doit le signaler (STALE_VERSION), pas l'écraser sans le dire.
  const [openedVersion] = useState(task?.version);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readTaskForm(new FormData(form));
    if (task === undefined) {
      const input = validate(form, createTaskInputSchema, createValues(listId, parentId, values));
      if (input !== null)
        createTask.mutate(input, {
          onSuccess: (created) => {
            if (onCreated !== undefined) {
              onCreated(created);
              return;
            }
            notify(parentId === undefined ? TODO_LABELS.taskAdded : TODO_LABELS.subtaskAdded);
            resetForNext(form);
          },
        });
      return;
    }
    const input = validate(form, updateTaskInputSchema, updateValues(task, openedVersion, values));
    if (input !== null)
      updateTask.mutate(input, {
        onSuccess: () => {
          notify(TODO_LABELS.taskUpdated);
          onDone?.();
        },
      });
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
      <TaskDetails listId={listId} task={task} invalid={invalid} />
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
