"use client";

import type { TodoListOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { cn } from "@planifier/ui/lib/cn";
import { useState } from "react";

import { ConfirmDelete } from "../atoms/confirm-delete";
import { TaskRow } from "../atoms/task-row";
import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { ListForm } from "../forms/list-form";
import { TaskForm } from "../forms/task-form";
import { useDeleteList, useTasks } from "../queries/todo.queries";
import { TINT_BACKGROUND, TINT_OPTIONS } from "../utils/list-tint";

function openCountLabel(count: number): string {
  if (count === 0) return "Rien à faire pour l'instant";
  return count === 1 ? "1 tâche à faire" : `${String(count)} tâches à faire`;
}

function TaskList({ listId }: { listId: string }) {
  const tasks = useTasks(listId);
  if (tasks.isPending) {
    return (
      <p role="status" className="text-muted">
        Chargement des tâches…
      </p>
    );
  }
  if (tasks.isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <TodoErrorAlert error={tasks.error} />
        <Button variant="secondary" onClick={() => void tasks.refetch()}>
          Réessayer maintenant
        </Button>
      </div>
    );
  }
  const open = tasks.data.items.filter(({ completedAt }) => completedAt === null);
  const done = tasks.data.items.filter(({ completedAt }) => completedAt !== null);
  if (tasks.data.items.length === 0) {
    return (
      <p className="text-muted">Aucune tâche dans cette liste. Ajoute la première ci-dessus.</p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {open.length === 0 ? (
        <p className="text-muted">Tout est coché dans cette liste.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="À faire">
          {open.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
      {done.length === 0 ? null : (
        <section aria-labelledby="taches-cochees" className="flex flex-col gap-2">
          <h3 id="taches-cochees" className="text-sm font-semibold text-muted">
            Cochées ({done.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type Mode = "view" | "edit" | "confirmDelete";

interface ListPanelProps {
  list: TodoListOutput;
  /** Après la suppression de la liste. */
  onDeleted: () => void;
}

/** Une liste : en-tête teinté (nom, compte), ajout de tâche, tâches à faire puis cochées. */
export function ListPanel({ list, onDeleted }: ListPanelProps) {
  const [mode, setMode] = useState<Mode>("view");
  const deleteList = useDeleteList();
  const tintLabel = TINT_OPTIONS.find(({ value }) => value === list.tint)?.label;

  return (
    <section aria-labelledby="liste-titre" className="flex flex-col gap-4">
      <header
        className={cn(
          "flex flex-col gap-3 rounded-card px-5 py-5 text-ink",
          TINT_BACKGROUND[list.tint],
        )}
      >
        {mode === "edit" ? (
          <div className="rounded-control bg-surface p-4">
            <ListForm
              list={list}
              onSaved={() => {
                setMode("view");
              }}
              onCancel={() => {
                setMode("view");
              }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Liste perso · {tintLabel}</p>
              <h2 id="liste-titre" className="font-display text-2xl font-bold tracking-tight">
                {list.name}
              </h2>
              <p className="text-sm">{openCountLabel(list.openTaskCount)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-11 bg-surface"
                onClick={() => {
                  setMode("edit");
                }}
              >
                Modifier
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 bg-surface"
                onClick={() => {
                  setMode("confirmDelete");
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}
        {mode === "confirmDelete" ? (
          <ConfirmDelete
            question={`Supprimer la liste « ${list.name} » et toutes ses tâches ?`}
            confirmLabel="Supprimer définitivement"
            keepLabel="Garder la liste"
            pending={deleteList.isPending}
            onConfirm={() => {
              deleteList.mutate({ listId: list.id }, { onSuccess: onDeleted });
            }}
            onKeep={() => {
              setMode("view");
            }}
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
