"use client";

import type { TodoListOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LoadError } from "../atoms/load-error";
import { ListForm } from "../forms/list-form";
import { useTodoLists } from "../queries/todo.queries";
import { listHref } from "../utils/list-href";
import { allLists } from "../utils/list-pages";
import { ListPanel } from "./list-panel";

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
}

/** Onglets des listes (liens `?liste=`, partageables), puis l'entrée de création. */
function ListTabs({ lists, selectedId, onCreate, onShowMore }: ListTabsProps) {
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
            <Button variant="ghost" size="sm" onClick={onShowMore}>
              Voir plus de listes
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
  const lists = useTodoLists();
  const [creating, setCreating] = useState(false);

  function showList(list: TodoListOutput) {
    setCreating(false);
    router.push(listHref(list.id));
  }

  if (lists.isPending) {
    return (
      <p role="status" className="text-muted">
        Chargement de tes listes…
      </p>
    );
  }
  if (lists.isError) {
    return <LoadError error={lists.error} onRetry={() => void lists.refetch()} />;
  }

  const items = allLists(lists.data);
  const selected = items.find(({ id }) => id === selectedListId) ?? items[0];
  const listForm = (
    <section aria-labelledby="nouvelle-liste" className="rounded-card bg-surface p-5">
      <h2 id="nouvelle-liste" className="mb-4 font-display text-xl font-bold">
        Nouvelle liste
      </h2>
      <ListForm
        onSaved={showList}
        onCancel={() => {
          setCreating(false);
        }}
      />
    </section>
  );

  if (selected === undefined) {
    return creating ? (
      listForm
    ) : (
      <div className="flex flex-col items-start gap-4 rounded-card bg-surface p-6">
        <p>
          Tu n&apos;as encore aucune liste. Une liste réunit des tâches : courses, maison, vacances…
        </p>
        <Button
          onClick={() => {
            setCreating(true);
          }}
        >
          Créer ma première liste
        </Button>
      </div>
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
        onShowMore={
          lists.hasNextPage && !lists.isFetchingNextPage
            ? () => void lists.fetchNextPage()
            : undefined
        }
      />
      {creating ? listForm : null}
      <ListPanel
        key={selected.id}
        list={selected}
        onDeleted={() => {
          router.push(listHref(null));
        }}
      />
    </div>
  );
}
