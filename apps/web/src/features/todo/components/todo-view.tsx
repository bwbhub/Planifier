"use client";

import { TitledSection } from "@planifier/ui/components/titled-section";
import type { TodoListOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { COMMON_LABELS } from "@/lib/labels";

import { ListForm } from "../forms/list-form";
import { listHref } from "../utils/list-href";
import { useSelectedList } from "../utils/use-selected-list";
import { ListPanel } from "./list-panel";
import { TODO_LABELS } from "../labels";
import { todoErrorMessage } from "../utils/todo-error-message";

interface TodoViewProps {
  /** Liste choisie dans l'URL (`?liste=`) ; absente ou inconnue : la première. */
  selectedListId: string | null;
}

interface ListTabsProps {
  lists: readonly TodoListOutput[];
  selectedId: string;
  onCreate: () => void;
  /** Présent s'il reste des listes à lire : elles s'ajoutent aux onglets. */
  onShowMore: (() => void) | undefined;
  loadingMore: boolean;
}

/** Onglets des listes (liens `?liste=`, partageables), puis l'entrée de création. */
function ListTabs({ lists, selectedId, onCreate, onShowMore, loadingMore }: ListTabsProps) {
  return (
    <nav aria-label="Mes listes" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {lists.map((list) => {
          const current = list.id === selectedId;
          return (
            <li key={list.id} className="shrink-0">
              <Link
                href={listHref(list.id)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-pill px-4 text-control font-semibold",
                  current ? "bg-ink text-surface" : "bg-field text-ink hover:bg-line",
                )}
              >
                {list.name}
                {list.openTaskCount === 0 ? null : (
                  <span className="text-sm opacity-80">{list.openTaskCount}</span>
                )}
              </Link>
            </li>
          );
        })}
        {onShowMore === undefined ? null : (
          <li className="shrink-0">
            <Button variant="ghost" size="sm" disabled={loadingMore} onClick={onShowMore}>
              {loadingMore ? "Chargement des listes…" : "Voir plus de listes"}
            </Button>
          </li>
        )}
        <li className="shrink-0">
          <Button variant="ghost" size="sm" onClick={onCreate}>
            + Nouvelle liste
          </Button>
        </li>
      </ul>
    </nav>
  );
}

/** Écran Todo : onglets des listes, liste choisie, création d'une liste. */
export function TodoView({ selectedListId }: TodoViewProps) {
  const router = useRouter();
  const { lists, items, searching } = useSelectedList(selectedListId);
  const [creating, setCreating] = useState(false);

  function showList(list: TodoListOutput) {
    setCreating(false);
    router.push(listHref(list.id));
  }

  if (lists.isPending || searching) {
    return <ListSkeleton label={TODO_LABELS.loadingLists} />;
  }
  if (lists.isError) {
    return (
      <LoadError
        message={todoErrorMessage(lists.error)}
        retryLabel={COMMON_LABELS.retry}
        onRetry={() => void lists.refetch()}
      />
    );
  }

  const selected = items.find(({ id }) => id === selectedListId) ?? items[0];
  const listForm = (
    <TitledSection title="Nouvelle liste">
      <ListForm
        onSaved={showList}
        onCancel={() => {
          setCreating(false);
        }}
      />
    </TitledSection>
  );

  if (selected === undefined) {
    return creating ? (
      listForm
    ) : (
      <EmptyState
        title={TODO_LABELS.noListTitle}
        description={TODO_LABELS.noListHint}
        action={
          <Button
            onClick={() => {
              setCreating(true);
            }}
          >
            Créer ma première liste
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ListTabs
        lists={items}
        selectedId={selected.id}
        onCreate={() => {
          setCreating(true);
        }}
        onShowMore={lists.hasNextPage ? () => void lists.fetchNextPage() : undefined}
        loadingMore={lists.isFetchingNextPage}
      />
      {creating ? listForm : null}
      <ListPanel
        // Droits changés (liste passée en lecture seule) : rien d'ouvert ne survit.
        key={`${selected.id}:${String(selected.can.write)}`}
        list={selected}
        onDeleted={() => {
          router.push(listHref(null));
        }}
      />
    </div>
  );
}
