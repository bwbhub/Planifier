"use client";

import type { TodoListOutput } from "@planifier/api-contract";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { SelectField } from "@planifier/ui/components/select-field";
import { Sheet } from "@planifier/ui/components/sheet";
import { useToast } from "@planifier/ui/components/toast";
import Link from "next/link";
import { useState } from "react";

import { COMMON_LABELS } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

import { TaskForm } from "../forms/task-form";
import { TODO_LABELS } from "../labels";
import { ListViewProvider } from "../utils/list-view";
import { defaultTaskList, writableLists } from "../utils/new-task-list";
import { todoErrorMessage } from "../utils/todo-error-message";
import { useSelectedList } from "../utils/use-selected-list";

interface NewTaskSheetProps {
  open: boolean;
  onClose: () => void;
  /** Liste regardée quand on ouvre la feuille (`?liste=`) ; elle est proposée d'abord. */
  openListId: string | null;
}

interface PickerProps {
  lists: readonly TodoListOutput[];
  openListId: string | null;
  onClose: () => void;
}

/** Choix de la liste, puis le formulaire de tâche (le même que dans la liste) : un ajout ferme la feuille. */
function ListAndForm({ lists, openListId, onClose }: PickerProps) {
  const { notify } = useToast();
  const [chosenId, setChosenId] = useState(defaultTaskList(lists, openListId)?.id ?? null);
  const list = lists.find(({ id }) => id === chosenId) ?? defaultTaskList(lists, openListId);
  if (list === null) return null;
  return (
    <>
      <SelectField
        label={TODO_LABELS.listField}
        value={list.id}
        options={lists.map(({ id, name }) => ({ value: id, label: name }))}
        onChange={(event) => {
          setChosenId(event.target.value);
        }}
      />
      {/* Clé : changer de liste repart d'un formulaire neuf (l'assigné dépend de la liste). */}
      <ListViewProvider
        key={list.id}
        value={{ shared: list.space !== null, readOnly: false, isDimmed: () => false }}
      >
        <TaskForm
          listId={list.id}
          onDone={onClose}
          onCreated={() => {
            onClose();
            notify(TODO_LABELS.taskAddedTo(list.name));
          }}
        />
      </ListViewProvider>
    </>
  );
}

function SheetBody({ openListId, onClose }: Omit<NewTaskSheetProps, "open">) {
  const { lists, items, searching } = useSelectedList(openListId);
  if (lists.isError) {
    return (
      <LoadError
        message={todoErrorMessage(lists.error)}
        retryLabel={COMMON_LABELS.retry}
        onRetry={() => void lists.refetch()}
      />
    );
  }
  // Tant qu'on cherche la liste de l'adresse dans les pages suivantes, on n'affiche pas une autre liste à sa place.
  if (!lists.isSuccess || searching)
    return <ListSkeleton label={TODO_LABELS.loadingLists} rows={2} />;
  const writable = writableLists(items);
  if (writable.length === 0) {
    return (
      <EmptyState
        level={3}
        title={TODO_LABELS.noWritableListTitle}
        description={TODO_LABELS.noWritableListHint}
        action={
          <Link
            href={ROUTES.todo}
            onClick={onClose}
            className="font-semibold text-accent-text underline"
          >
            {TODO_LABELS.openTodo}
          </Link>
        }
      />
    );
  }
  return <ListAndForm lists={writable} openListId={openListId} onClose={onClose} />;
}

/**
 * « Nouvelle tâche » : feuille ouverte par le « + », au-dessus de la page courante. Le formulaire est celui de la
 * liste (titre, détails facultatifs) ; seule s'ajoute la liste où la tâche va. Fermée, elle ne lit rien.
 */
export function NewTaskSheet({ open, onClose, openListId }: NewTaskSheetProps) {
  // Retirée une fois fermée : une feuille fermée gardée dans la page porterait encore le nom « Nouvelle tâche », que le
  // champ de titre des listes porte aussi (les deux se confondraient pour un lecteur d'écran, comme pour un test).
  if (!open) return null;
  return (
    <Sheet open onClose={onClose} title={TODO_LABELS.newTask} size="form">
      <SheetBody openListId={openListId} onClose={onClose} />
    </Sheet>
  );
}
