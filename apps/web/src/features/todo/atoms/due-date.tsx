"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";

import { useUpdateTask } from "../queries/todo.queries";
import { formatDueDate, isPastDue, today } from "../utils/due-date";
import { TodoErrorAlert } from "./todo-error-alert";

/** Échéance ; passée, elle se dit sans reproche et propose un report (CONTEXT.md, tâche en retard). */
export function DueDate({ task, done }: { task: TaskOutput; done: boolean }) {
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
