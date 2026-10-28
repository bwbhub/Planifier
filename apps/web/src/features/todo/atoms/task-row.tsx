"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { useState } from "react";

import { TaskForm } from "../forms/task-form";
import { useDeleteTask, useUpdateTask } from "../queries/todo.queries";
import { formatDueDate, isPastDue, today } from "../utils/due-date";
import { useInPlaceMode } from "../utils/use-in-place-mode";
import { TodoErrorAlert } from "./todo-error-alert";

/** Coche ou décoche une tâche, au geste de l'utilisateur seulement ; l'erreur s'affiche dans la liste. */
export type ToggleTask = (task: TaskOutput, done: boolean) => void;

/** Échéance ; passée, elle se dit sans reproche et propose un report (CONTEXT.md, tâche en retard). */
function DueDate({ task, done }: { task: TaskOutput; done: boolean }) {
  const updateTask = useUpdateTask();
  if (task.dueDate === null) return null;
  const todayDay = today();
  const label = formatDueDate(task.dueDate, todayDay);
  if (done || !isPastDue(task.dueDate, todayDay)) {
    return <span className="text-sm text-muted">Pour le {label}</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
      Prévue le {label}
      <Button
        variant="ghost"
        size="sm"
        disabled={updateTask.isPending}
        onClick={() => {
          updateTask.mutate({ taskId: task.id, version: task.version, dueDate: todayDay });
        }}
      >
        Reporter à aujourd&apos;hui<span className="sr-only"> « {task.title} »</span>
      </Button>
      {updateTask.isError ? <TodoErrorAlert error={updateTask.error} /> : null}
    </span>
  );
}

/** Question de suppression : elle nomme les sous-tâches qui partent avec la tâche. */
function deleteQuestion(task: TaskOutput, subtaskCount: number): string {
  if (subtaskCount === 0) return `Supprimer « ${task.title} » ?`;
  if (subtaskCount === 1) return `Supprimer « ${task.title} » et sa sous-tâche ?`;
  return `Supprimer « ${task.title} » et ses ${String(subtaskCount)} sous-tâches ?`;
}

function subtaskCountLabel(subtasks: readonly TaskOutput[]): string {
  const done = subtasks.filter(({ completedAt }) => completedAt !== null).length;
  return `${String(done)} sur ${String(subtasks.length)} sous-tâche${subtasks.length > 1 ? "s" : ""} cochée${done > 1 ? "s" : ""}`;
}

interface SubtasksProps {
  task: TaskOutput;
  subtasks: readonly TaskOutput[];
  adding: boolean;
  onToggle: ToggleTask;
  onStopAdding: () => void;
}

/** Sous-tâches d'une tâche, cochées une à une (rien ne se coche en cascade), et leur ajout sur place. */
function Subtasks({ task, subtasks, adding, onToggle, onStopAdding }: SubtasksProps) {
  if (subtasks.length === 0 && !adding) return null;
  return (
    <div className="flex flex-col gap-2 pl-8">
      {subtasks.length === 0 ? null : (
        <>
          <p className="text-sm text-muted">{subtaskCountLabel(subtasks)}</p>
          <ul
            className="flex flex-col gap-1 border-l-2 border-line pl-3"
            aria-label={`Sous-tâches de « ${task.title} »`}
          >
            {subtasks.map((subtask) => (
              <TaskRow key={subtask.id} task={subtask} subtasks={[]} onToggle={onToggle} />
            ))}
          </ul>
        </>
      )}
      {adding ? <TaskForm listId={task.listId} parentId={task.id} onDone={onStopAdding} /> : null}
    </div>
  );
}

/** Case à cocher et titre, puis échéance et description. */
function TaskMain({
  task,
  done,
  onToggle,
}: {
  task: TaskOutput;
  done: boolean;
  onToggle: ToggleTask;
}) {
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 pt-2.5">
        <input
          type="checkbox"
          checked={done}
          onChange={(event) => {
            onToggle(task, event.target.checked);
          }}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent"
        />
        <span className={done ? "text-muted line-through" : "font-semibold"}>{task.title}</span>
      </label>
      <div className="flex flex-col gap-0.5 pl-8">
        <DueDate task={task} done={done} />
        {task.description === null ? null : (
          <span className="text-sm whitespace-pre-line text-muted">{task.description}</span>
        )}
      </div>
    </div>
  );
}

interface TaskActionsProps {
  task: TaskOutput;
  /** Absent pour une sous-tâche : un seul niveau. */
  onAddSubtask: (() => void) | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

/** Actions discrètes d'une tâche, nommées avec son titre pour les lecteurs d'écran. */
function TaskActions({ task, onAddSubtask, onEdit, onDelete }: TaskActionsProps) {
  return (
    <div className="-ml-3 flex flex-wrap pl-8 sm:ml-0 sm:shrink-0 sm:justify-end sm:pl-0">
      {onAddSubtask === undefined ? null : (
        <Button variant="ghost" size="sm" onClick={onAddSubtask}>
          + Sous-tâche<span className="sr-only"> à « {task.title} »</span>
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Modifier<span className="sr-only"> « {task.title} »</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Supprimer<span className="sr-only"> « {task.title} »</span>
      </Button>
    </div>
  );
}

interface TaskRowProps {
  task: TaskOutput;
  /** Sous-tâches de `task` ; toujours vide pour une sous-tâche (un seul niveau). */
  subtasks: readonly TaskOutput[];
  onToggle: ToggleTask;
}

/** Une tâche : case à cocher, échéance, description, sous-tâches ; modification et suppression sur place. */
export function TaskRow({ task, subtasks, onToggle }: TaskRowProps) {
  const { mode, showView, showEdit, showConfirmDelete } = useInPlaceMode();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const deleteTask = useDeleteTask();
  const done = task.completedAt !== null;
  const isSubtask = task.parentId !== null;

  if (mode === "edit") {
    return (
      <li className="rounded-control bg-surface p-4">
        <TaskForm listId={task.listId} task={task} onDone={showView} />
      </li>
    );
  }

  return (
    <li
      className={
        isSubtask
          ? "flex flex-col gap-1"
          : "flex flex-col gap-2 rounded-control bg-surface px-4 py-3"
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
        <TaskMain task={task} done={done} onToggle={onToggle} />
        {mode === "view" ? (
          <TaskActions
            task={task}
            onAddSubtask={
              isSubtask
                ? undefined
                : () => {
                    setAddingSubtask(true);
                  }
            }
            onEdit={showEdit}
            onDelete={showConfirmDelete}
          />
        ) : null}
      </div>
      {mode === "confirmDelete" ? (
        <ConfirmPanel
          question={deleteQuestion(task, subtasks.length)}
          confirmLabel="Supprimer définitivement"
          keepLabel="Garder la tâche"
          pending={deleteTask.isPending}
          onConfirm={() => {
            deleteTask.mutate({ taskId: task.id });
          }}
          onKeep={showView}
        />
      ) : null}
      {deleteTask.isError ? <TodoErrorAlert error={deleteTask.error} /> : null}
      <Subtasks
        task={task}
        subtasks={subtasks}
        adding={addingSubtask}
        onToggle={onToggle}
        onStopAdding={() => {
          setAddingSubtask(false);
        }}
      />
    </li>
  );
}
