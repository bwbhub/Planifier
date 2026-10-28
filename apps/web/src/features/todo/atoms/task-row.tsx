"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";

import { TaskForm } from "../forms/task-form";
import { useDeleteTask, useUpdateTask } from "../queries/todo.queries";
import { formatDueDate, isPastDue, today } from "../utils/due-date";
import { useInPlaceMode } from "../utils/use-in-place-mode";
import { TodoErrorAlert } from "./todo-error-alert";

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

interface TaskRowProps {
  task: TaskOutput;
  /** Coche ou décoche, au geste de l'utilisateur seulement ; l'erreur s'affiche dans la liste. */
  onToggle: (done: boolean) => void;
}

/** Une tâche : case à cocher, échéance et description, modification et suppression sur place. */
export function TaskRow({ task, onToggle }: TaskRowProps) {
  const { mode, showView, showEdit, showConfirmDelete } = useInPlaceMode();
  const deleteTask = useDeleteTask();
  const done = task.completedAt !== null;

  if (mode === "edit") {
    return (
      <li className="rounded-control bg-surface p-4">
        <TaskForm listId={task.listId} task={task} onDone={showView} />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-control bg-surface px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 pt-2.5">
            <input
              type="checkbox"
              checked={done}
              onChange={(event) => {
                onToggle(event.target.checked);
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
        {mode === "view" ? (
          <div className="flex shrink-0">
            <Button variant="ghost" size="sm" onClick={showEdit}>
              Modifier<span className="sr-only"> « {task.title} »</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={showConfirmDelete}>
              Supprimer<span className="sr-only"> « {task.title} »</span>
            </Button>
          </div>
        ) : null}
      </div>
      {mode === "confirmDelete" ? (
        <ConfirmPanel
          question={`Supprimer « ${task.title} » ?`}
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
    </li>
  );
}
