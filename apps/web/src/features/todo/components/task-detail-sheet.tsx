"use client";

import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { Sheet } from "@planifier/ui/components/sheet";

import { isNotFound } from "@/features/_shared/utils/action-error-message";
import { COMMON_LABELS } from "@/lib/labels";

import { TODO_LABELS } from "../labels";
import { useTask } from "../queries/todo.queries";
import { todoErrorMessage } from "../utils/todo-error-message";
import { TaskDetailBody } from "./task-detail-body";

interface TaskDetailSheetProps {
  taskId: string;
  onClose: () => void;
}

function Content({ taskId, onClose }: TaskDetailSheetProps) {
  const task = useTask(taskId);
  if (task.isError) {
    // Supprimée ou jamais visible : même réponse, on le dit sans détour.
    if (isNotFound(task.error))
      return (
        <EmptyState level={3} title={TODO_LABELS.taskGone} description={TODO_LABELS.taskGoneHint} />
      );
    return (
      <LoadError
        message={todoErrorMessage(task.error)}
        retryLabel={COMMON_LABELS.retry}
        onRetry={() => void task.refetch()}
      />
    );
  }
  if (!task.isSuccess) return <ListSkeleton label={TODO_LABELS.loadingTask} rows={3} />;
  return <TaskDetailBody detail={task.data} onClose={onClose} />;
}

/** Détail d'une tâche : feuille ouverte par `?tache=<id>`, au-dessus de la page courante. */
export function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  return (
    <Sheet open onClose={onClose} title={TODO_LABELS.taskDetail} size="form">
      <Content taskId={taskId} onClose={onClose} />
    </Sheet>
  );
}
