"use client";

import type { TaskOutput, TodoListOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { cn } from "@planifier/ui/lib/cn";

import { LoadError } from "../atoms/load-error";
import { TaskRow, type ToggleTask } from "../atoms/task-row";
import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { ListForm } from "../forms/list-form";
import { TaskForm } from "../forms/task-form";
import { useDeleteList, useTasks } from "../queries/todo.queries";
import { TINTS } from "../utils/list-tint";
import { isSubtask, subtasksByParent } from "../utils/subtasks";
import { useInPlaceMode } from "../utils/use-in-place-mode";
import { useToggleTask } from "../utils/use-toggle-task";

function openCountLabel(count: number): string {
  if (count === 0) return "Rien à faire pour l'instant";
  return count === 1 ? "1 tâche à faire" : `${String(count)} tâches à faire`;
}

interface TaskSectionsProps {
  tasks: readonly TaskOutput[];
  onToggle: ToggleTask;
}

/** À faire, puis cochées : une tâche cochée change de section avec ses sous-tâches. */
function TaskSections({ tasks, onToggle }: TaskSectionsProps) {
  const byParent = subtasksByParent(tasks);
  const topLevel = tasks.filter((task) => !isSubtask(task));
  const open = topLevel.filter(({ completedAt }) => completedAt === null);
  const done = topLevel.filter(({ completedAt }) => completedAt !== null);
  const rows = (items: TaskOutput[]) =>
    items.map((task) => (
      <TaskRow
        key={task.id}
        task={task}
        subtasks={byParent.get(task.id) ?? []}
        onToggle={onToggle}
      />
    ));
  return (
    <>
      {open.length === 0 ? (
        <p className="text-muted">Tout est coché dans cette liste.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="À faire">
          {rows(open)}
        </ul>
      )}
      {done.length === 0 ? null : (
        <section aria-labelledby="taches-cochees" className="flex flex-col gap-2">
          <h3 id="taches-cochees" className="text-sm font-semibold text-muted">
            Cochées ({done.length})
          </h3>
          <ul className="flex flex-col gap-2">{rows(done)}</ul>
        </section>
      )}
    </>
  );
}

/**
 * Tâches de la liste. La coche vit ici et non dans la ligne : cochée, une tâche change de section (ligne recréée),
 * et un refus du serveur doit rester visible après ce déplacement.
 */
function TaskList({ listId }: { listId: string }) {
  const tasks = useTasks(listId);
  const { toggle, notice, error } = useToggleTask(listId);
  if (tasks.isPending) {
    return (
      <p role="status" className="text-muted">
        Chargement des tâches…
      </p>
    );
  }
  if (tasks.isError) {
    return <LoadError error={tasks.error} onRetry={() => void tasks.refetch()} />;
  }
  if (tasks.data.items.length === 0) {
    return (
      <p className="text-muted">Aucune tâche dans cette liste. Ajoute la première ci-dessus.</p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {error === null ? null : <TodoErrorAlert error={error} />}
      <p role="status" className={notice === null ? "sr-only" : "text-sm font-semibold"}>
        {notice}
      </p>
      <TaskSections tasks={tasks.data.items} onToggle={toggle} />
    </div>
  );
}

interface ListPanelProps {
  list: TodoListOutput;
  /** Après la suppression de la liste. */
  onDeleted: () => void;
}

/** Une liste : en-tête teinté (nom, compte), ajout de tâche, tâches à faire puis cochées. */
export function ListPanel({ list, onDeleted }: ListPanelProps) {
  const { mode, showView, showEdit, showConfirmDelete } = useInPlaceMode();
  const deleteList = useDeleteList();
  const tint = TINTS[list.tint];

  return (
    // Nommée par le nom de la liste, qu'on la lise ou qu'on la modifie (le titre disparaît en modification).
    <section aria-label={list.name} className="flex flex-col gap-4">
      <header
        className={cn("flex flex-col gap-3 rounded-card px-5 py-5 text-ink", tint.background)}
      >
        {mode === "edit" ? (
          <div className="rounded-control bg-surface p-4">
            <ListForm list={list} onSaved={showView} onCancel={showView} />
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Liste perso · {tint.label}</p>
              <h2 className="font-display text-2xl font-bold tracking-tight">{list.name}</h2>
              <p className="text-sm">{openCountLabel(list.openTaskCount)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="surface" size="sm" onClick={showEdit}>
                Modifier<span className="sr-only"> la liste</span>
              </Button>
              <Button variant="surface" size="sm" onClick={showConfirmDelete}>
                Supprimer<span className="sr-only"> la liste</span>
              </Button>
            </div>
          </div>
        )}
        {mode === "confirmDelete" ? (
          <ConfirmPanel
            question={`Supprimer la liste « ${list.name} » et toutes ses tâches ?`}
            confirmLabel="Supprimer définitivement"
            keepLabel="Garder la liste"
            pending={deleteList.isPending}
            onConfirm={() => {
              deleteList.mutate({ listId: list.id }, { onSuccess: onDeleted });
            }}
            onKeep={showView}
          />
        ) : null}
        {deleteList.isError ? <TodoErrorAlert error={deleteList.error} /> : null}
      </header>
      <div className="rounded-card bg-surface p-5">
        {/* Clé : un formulaire neuf par liste (rien de saisi ne passe d'une liste à l'autre). */}
        <TaskForm key={list.id} listId={list.id} />
      </div>
      <TaskList listId={list.id} />
    </section>
  );
}
