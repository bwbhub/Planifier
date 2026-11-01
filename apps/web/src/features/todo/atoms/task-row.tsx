"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { Avatar } from "@planifier/ui/components/avatar";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { cn } from "@planifier/ui/lib/cn";
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
  isDimmed: (task: TaskOutput) => boolean;
  onStopAdding: () => void;
}

/** Sous-tâches d'une tâche, cochées une à une (rien ne se coche en cascade), et leur ajout sur place. */
function Subtasks({
  task,
  subtasks,
  adding,
  completion,
  shared,
  isDimmed,
  onStopAdding,
}: SubtasksProps) {
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
              <TaskRow
                key={subtask.id}
                task={subtask}
                completion={completion}
                shared={shared}
                isDimmed={isDimmed}
              />
            ))}
          </ul>
        </>
      )}
      {adding ? (
        <TaskForm listId={task.listId} parentId={task.id} shared={shared} onDone={onStopAdding} />
      ) : null}
    </div>
  );
}

/** Case à cocher et titre, puis échéance, répétition, description et, liste partagée, assigné et qui l'a cochée. */
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
        {task.assignee === null ? null : (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Avatar id={task.assignee.userId} name={task.assignee.name} size="sm" />
            Assignée à {task.assignee.name}
          </span>
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
  done: boolean;
  onAddSubtask: () => void;
  onFinish: TaskCompletion["finish"];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Actions discrètes d'une tâche, nommées avec son titre pour les lecteurs d'écran. Sous-tâche : pas d'ajout, un seul
 * niveau. « Terminer » : tâche répétée à faire seulement.
 */
function TaskActions({ task, done, onAddSubtask, onFinish, onEdit, onDelete }: TaskActionsProps) {
  return (
    <div className="-ml-3 flex flex-wrap pl-8 sm:ml-0 sm:shrink-0 sm:justify-end sm:pl-0">
      {isSubtask(task) ? null : (
        <Button variant="ghost" size="sm" onClick={onAddSubtask}>
          + Sous-tâche<span className="sr-only"> à « {task.title} »</span>
        </Button>
      )}
      {task.recurrence === null || done ? null : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFinish(task);
          }}
        >
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
  /** Tâche atténuée, ligne par ligne : une sous-tâche garde son propre état sous sa tâche. */
  isDimmed?: ((task: TaskOutput) => boolean) | undefined;
}

const NEVER_DIMMED = () => false;

/** Une tâche : case à cocher, échéance, description, sous-tâches ; modification et suppression sur place. */
export function TaskRow({
  task,
  subtasks = [],
  completion,
  shared,
  isDimmed = NEVER_DIMMED,
}: TaskRowProps) {
  const { mode, showView, showEdit, showConfirmDelete } = useInPlaceMode();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const deleteTask = useDeleteTask();
  const done = task.completedAt !== null;
  const subtaskList = (
    <Subtasks
      task={task}
      subtasks={subtasks}
      adding={addingSubtask}
      completion={completion}
      shared={shared}
      isDimmed={isDimmed}
      onStopAdding={() => {
        setAddingSubtask(false);
      }}
    />
  );

  // En modification, seule la tâche devient un formulaire : ses sous-tâches restent affichées dessous.
  if (mode === "edit") {
    return (
      <li className="flex flex-col gap-2 rounded-control bg-surface p-4">
        <TaskForm listId={task.listId} task={task} shared={shared} onDone={showView} />
        {subtaskList}
      </li>
    );
  }

  return (
    <li
      className={
        isSubtask(task)
          ? "flex flex-col gap-1"
          : "flex flex-col gap-2 rounded-control bg-surface px-4 py-3"
      }
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-start sm:gap-3",
          isDimmed(task) && "opacity-45",
        )}
      >
        <TaskMain task={task} done={done} shared={shared} onToggle={completion.toggle} />
        {mode === "view" ? (
          <TaskActions
            task={task}
            done={done}
            onAddSubtask={() => {
              setAddingSubtask(true);
            }}
            onFinish={completion.finish}
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
