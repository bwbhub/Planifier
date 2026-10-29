"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { useState } from "react";

import { TaskForm } from "../forms/task-form";
import { useDeleteTask } from "../queries/todo.queries";
import { recurrenceLabel } from "../utils/recurrence";
import { deleteQuestion, isSubtask, subtaskCountLabel } from "../utils/subtasks";
import { useInPlaceMode } from "../utils/use-in-place-mode";
import { DueDate } from "./due-date";
import { TodoErrorAlert } from "./todo-error-alert";

/**
 * Gestes de complétion d'une tâche, au geste de l'utilisateur seulement ; erreur et annonce s'affichent dans la liste.
 * `toggle` : cocher ou décocher (tâche répétée : occurrence faite) ; `finish` : terminer pour de bon une tâche répétée.
 */
export interface TaskCompletion {
  toggle: (task: TaskOutput, done: boolean) => void;
  finish: (task: TaskOutput) => void;
}

interface SubtasksProps {
  task: TaskOutput;
  subtasks: readonly TaskOutput[];
  adding: boolean;
  completion: TaskCompletion;
  shared: boolean;
  onStopAdding: () => void;
}

/** Sous-tâches d'une tâche, cochées une à une (rien ne se coche en cascade), et leur ajout sur place. */
function Subtasks({ task, subtasks, adding, completion, shared, onStopAdding }: SubtasksProps) {
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
              <TaskRow key={subtask.id} task={subtask} completion={completion} shared={shared} />
            ))}
          </ul>
        </>
      )}
      {adding ? <TaskForm listId={task.listId} parentId={task.id} onDone={onStopAdding} /> : null}
    </div>
  );
}

/** Case à cocher et titre, puis échéance, répétition, description et, liste partagée, qui l'a cochée. */
function TaskMain({
  task,
  done,
  shared,
  onToggle,
}: {
  task: TaskOutput;
  done: boolean;
  shared: boolean;
  onToggle: TaskCompletion["toggle"];
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
        {task.recurrence === null ? null : (
          <span className="text-sm text-muted">{recurrenceLabel(task.recurrence)}</span>
        )}
        {task.description === null ? null : (
          <span className="text-sm whitespace-pre-line text-muted">{task.description}</span>
        )}
        {shared && done && task.completedBy !== null ? (
          <span className="text-sm text-muted">Cochée par {task.completedBy.name}</span>
        ) : null}
      </div>
    </div>
  );
}

interface TaskActionsProps {
  task: TaskOutput;
  /** Absent pour une sous-tâche : un seul niveau. */
  onAddSubtask: (() => void) | undefined;
  /** Présent pour une tâche répétée à faire : la répétition s'arrête et la tâche est cochée. */
  onFinish: (() => void) | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

/** Actions discrètes d'une tâche, nommées avec son titre pour les lecteurs d'écran. */
function TaskActions({ task, onAddSubtask, onFinish, onEdit, onDelete }: TaskActionsProps) {
  return (
    <div className="-ml-3 flex flex-wrap pl-8 sm:ml-0 sm:shrink-0 sm:justify-end sm:pl-0">
      {onAddSubtask === undefined ? null : (
        <Button variant="ghost" size="sm" onClick={onAddSubtask}>
          + Sous-tâche<span className="sr-only"> à « {task.title} »</span>
        </Button>
      )}
      {onFinish === undefined ? null : (
        <Button variant="ghost" size="sm" onClick={onFinish}>
          Terminer<span className="sr-only"> « {task.title} » pour de bon</span>
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
  /** Sous-tâches de `task` ; absent pour une sous-tâche (un seul niveau). */
  subtasks?: readonly TaskOutput[];
  completion: TaskCompletion;
  /** Liste partagée : une tâche cochée dit par qui. */
  shared: boolean;
}

/** Une tâche : case à cocher, échéance, description, sous-tâches ; modification et suppression sur place. */
export function TaskRow({ task, subtasks = [], completion, shared }: TaskRowProps) {
  const { mode, showView, showEdit, showConfirmDelete } = useInPlaceMode();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const deleteTask = useDeleteTask();
  const done = task.completedAt !== null;
  const subtask = isSubtask(task);
  const subtaskList = (
    <Subtasks
      task={task}
      subtasks={subtasks}
      adding={addingSubtask}
      completion={completion}
      shared={shared}
      onStopAdding={() => {
        setAddingSubtask(false);
      }}
    />
  );

  // En modification, seule la tâche devient un formulaire : ses sous-tâches restent affichées dessous.
  if (mode === "edit") {
    return (
      <li className="flex flex-col gap-2 rounded-control bg-surface p-4">
        <TaskForm listId={task.listId} task={task} onDone={showView} />
        {subtaskList}
      </li>
    );
  }

  return (
    <li
      className={
        subtask ? "flex flex-col gap-1" : "flex flex-col gap-2 rounded-control bg-surface px-4 py-3"
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
        <TaskMain task={task} done={done} shared={shared} onToggle={completion.toggle} />
        {mode === "view" ? (
          <TaskActions
            task={task}
            onAddSubtask={
              subtask
                ? undefined
                : () => {
                    setAddingSubtask(true);
                  }
            }
            onFinish={
              task.recurrence === null || done
                ? undefined
                : () => {
                    completion.finish(task);
                  }
            }
            onEdit={showEdit}
            onDelete={showConfirmDelete}
          />
        ) : null}
      </div>
      {mode === "confirmDelete" ? (
        <ConfirmPanel
          question={deleteQuestion(task.title, subtasks.length)}
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
      {subtaskList}
    </li>
  );
}
