"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { useState } from "react";

import { TaskForm } from "../forms/task-form";
import { useDeleteTask, useSetTaskDone } from "../queries/todo.queries";
import { formatDueDate } from "../utils/due-date";
import { ConfirmDelete } from "./confirm-delete";
import { TodoErrorAlert } from "./todo-error-alert";

const SMALL_ACTION =
  "inline-flex min-h-11 items-center rounded-pill px-3 text-sm font-semibold text-muted hover:bg-field hover:text-ink";

type Mode = "view" | "edit" | "confirmDelete";

/** Titre, échéance et description d'une tâche ; une tâche cochée est barrée. */
function TaskSummary({ task, done }: { task: TaskOutput; done: boolean }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className={done ? "text-muted line-through" : "font-semibold"}>{task.title}</span>
      {task.dueDate === null ? null : (
        <span className="text-sm text-muted">Pour le {formatDueDate(task.dueDate)}</span>
      )}
      {task.description === null ? null : (
        <span className="text-sm whitespace-pre-line text-muted">{task.description}</span>
      )}
    </span>
  );
}

/** Une tâche : case à cocher (geste de l'utilisateur seulement), détails, modification et suppression sur place. */
export function TaskRow({ task }: { task: TaskOutput }) {
  const [mode, setMode] = useState<Mode>("view");
  const setDone = useSetTaskDone(task.listId);
  const deleteTask = useDeleteTask();
  const done = task.completedAt !== null;

  if (mode === "edit") {
    return (
      <li className="rounded-control bg-surface p-4">
        <TaskForm
          listId={task.listId}
          task={task}
          onDone={() => {
            setMode("view");
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-control bg-surface px-4 py-3">
      <div className="flex items-start gap-3">
        <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-3 pt-2.5">
          <input
            type="checkbox"
            checked={done}
            onChange={(event) => {
              setDone.mutate({ taskId: task.id, done: event.target.checked });
            }}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent"
          />
          <TaskSummary task={task} done={done} />
        </label>
        {mode === "view" ? (
          <div className="flex shrink-0">
            <button
              type="button"
              className={SMALL_ACTION}
              onClick={() => {
                setMode("edit");
              }}
            >
              Modifier<span className="sr-only"> « {task.title} »</span>
            </button>
            <button
              type="button"
              className={SMALL_ACTION}
              onClick={() => {
                setMode("confirmDelete");
              }}
            >
              Supprimer<span className="sr-only"> « {task.title} »</span>
            </button>
          </div>
        ) : null}
      </div>
      {mode === "confirmDelete" ? (
        <ConfirmDelete
          question={`Supprimer « ${task.title} » ?`}
          confirmLabel="Supprimer définitivement"
          keepLabel="Garder la tâche"
          pending={deleteTask.isPending}
          onConfirm={() => {
            deleteTask.mutate({ taskId: task.id });
          }}
          onKeep={() => {
            setMode("view");
          }}
        />
      ) : null}
      {setDone.isError ? <TodoErrorAlert error={setDone.error} /> : null}
      {deleteTask.isError ? <TodoErrorAlert error={deleteTask.error} /> : null}
    </li>
  );
}
