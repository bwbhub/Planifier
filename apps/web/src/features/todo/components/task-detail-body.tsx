"use client";

import type { GetTaskOutput, TaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { type ComponentType, useState } from "react";

import { TaskLine } from "@/features/_shared/components/task-line";
import { recurrenceLabel } from "@/features/_shared/utils/recurrence-label";

import { DueDate } from "../atoms/due-date";
import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { TaskForm } from "../forms/task-form";
import { TODO_LABELS } from "../labels";
import { useDeleteTask } from "../queries/todo.queries";
import { ListViewProvider } from "../utils/list-view";
import { deleteQuestion } from "../utils/subtasks";
import { useTaskCompletion } from "../utils/use-task-completion";

/**
 * Ce que le détail offre à un autre module (l'agenda) pour se montrer sous la tâche. `todo` n'importe pas ce module :
 * la couche `app` lui passe le composant.
 */
export interface TaskExtrasProps {
  task: { id: string; title: string; dueDate: string | null };
}

interface BodyProps {
  detail: GetTaskOutput;
  onClose: () => void;
  Extras?: ComponentType<TaskExtrasProps> | undefined;
}

/** Lecture seule (liste montrée par un autre) : ce que la tâche dit, sans geste possible. */
function ReadOnlyTask({ task }: { task: TaskOutput }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-semibold">{task.title}</p>
      <DueDate task={task} done />
      {task.recurrence === null ? null : (
        <span className="text-sm text-muted">{recurrenceLabel(task.recurrence)}</span>
      )}
      {task.description === null ? null : (
        <span className="text-sm whitespace-pre-line text-muted">{task.description}</span>
      )}
    </div>
  );
}

/** Sous-tâches : coche, et ajout rapide quand la liste s'écrit. Une sous-tâche n'en a pas (un seul niveau). */
function Subtasks({ detail }: { detail: GetTaskOutput }) {
  const { task, subtasks, list } = detail;
  const { completion, notice, error } = useTaskCompletion(list.id);
  if (task.parentId !== null) return null;
  return (
    <section aria-labelledby="subtasks-title" className="flex flex-col gap-2">
      <h3 id="subtasks-title" className="text-sm font-semibold text-muted">
        {TODO_LABELS.subtasksTitle}
      </h3>
      {subtasks.length === 0 ? null : (
        <ul className="flex flex-col gap-1">
          {subtasks.map((subtask) => (
            <li key={subtask.id}>
              <TaskLine
                title={subtask.title}
                done={subtask.completedAt !== null}
                onToggle={
                  list.canWrite
                    ? (checked) => {
                        completion.toggle(subtask, checked);
                      }
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
      {notice === null ? null : (
        <p role="status" className="text-sm text-muted">
          {notice.message}
        </p>
      )}
      {error === null ? null : <TodoErrorAlert error={error} />}
      {list.canWrite ? <TaskForm listId={list.id} parentId={task.id} /> : null}
    </section>
  );
}

/** Suppression avec confirmation ; les sous-tâches partent avec la tâche. */
function DeleteTask({ detail, onClose }: BodyProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteTask = useDeleteTask({ onDeleted: onClose });
  const { task, subtasks } = detail;
  if (!confirming) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          setConfirming(true);
        }}
      >
        {TODO_LABELS.delete}
      </Button>
    );
  }
  return (
    <>
      <ConfirmPanel
        question={deleteQuestion(task.title, subtasks.length)}
        confirmLabel="Supprimer définitivement"
        keepLabel="Garder la tâche"
        pending={deleteTask.isPending}
        onConfirm={() => {
          deleteTask.mutate({ taskId: task.id });
        }}
        onKeep={() => {
          setConfirming(false);
        }}
      />
      {deleteTask.isError ? <TodoErrorAlert error={deleteTask.error} /> : null}
    </>
  );
}

/** Le détail : le formulaire de la tâche (le même que partout), ses sous-tâches, sa suppression. */
export function TaskDetailBody({ detail, onClose, Extras }: BodyProps) {
  const { task, list } = detail;
  return (
    <ListViewProvider
      value={{ shared: list.shared, readOnly: !list.canWrite, isDimmed: () => false }}
    >
      <div className="flex flex-col gap-4">
        {list.canWrite ? (
          <TaskForm key={task.id} listId={list.id} task={task} onDone={onClose} />
        ) : (
          <ReadOnlyTask task={task} />
        )}
        <Subtasks detail={detail} />
        {Extras === undefined ? null : (
          <Extras task={{ id: task.id, title: task.title, dueDate: task.dueDate }} />
        )}
        {list.canWrite ? <DeleteTask detail={detail} onClose={onClose} /> : null}
      </div>
    </ListViewProvider>
  );
}
