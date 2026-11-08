"use client";

import type { AgendaWhen } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import Link from "next/link";
import { useState } from "react";

import { COMMON_LABELS } from "@/lib/labels";
import { today } from "@/lib/format-date";

import { EntryForm } from "../forms/entry-form";
import { AGENDA_LABELS } from "../labels";
import { useTaskEntries } from "../queries/agenda.queries";
import { dayMonthLabel } from "../utils/agenda-dates";
import { agendaHref } from "../utils/agenda-params";
import { agendaErrorMessage } from "../utils/agenda-error-message";
import { whenLabel } from "../utils/agenda-items";

/** Ce que l'agenda a besoin de savoir d'une tâche : de quoi proposer et lier un créneau. */
export interface TaskSlotsTask {
  id: string;
  title: string;
  /** Jour d'échéance (`AAAA-MM-JJ`) : le jour proposé pour le créneau ; absent : aujourd'hui. */
  dueDate: string | null;
  /** Heure d'échéance (`HH:MM`) : l'heure de début proposée ; absente : l'heure par défaut. */
  dueTime: string | null;
}

/** Jour où commence l'entrée. */
function dayOf(when: AgendaWhen): string {
  return when.allDay ? when.startDay : today(when.startsAt);
}

/**
 * Créneaux de l'agenda liés à une tâche, et « Créer un créneau » : le formulaire d'entrée habituel, proposé avec le
 * titre et l'échéance de la tâche. Le lien est à sens unique : la tâche ne se coche pas, le créneau ne se déplace pas
 * avec elle. Monté dans le détail de tâche par la couche `app`.
 */
export function TaskSlots({ task }: { task: TaskSlotsTask }) {
  const [creating, setCreating] = useState(false);
  const entries = useTaskEntries(task.id);
  return (
    <section aria-labelledby="task-slots-title" className="flex flex-col gap-2">
      <h3 id="task-slots-title" className="text-sm font-semibold text-muted">
        {AGENDA_LABELS.linkedSlots}
      </h3>
      {entries.isError ? (
        <LoadError
          message={agendaErrorMessage(entries.error)}
          retryLabel={COMMON_LABELS.retry}
          onRetry={() => void entries.refetch()}
        />
      ) : null}
      {entries.isPending ? <ListSkeleton label={AGENDA_LABELS.loadingSlots} rows={1} /> : null}
      {entries.data === undefined || entries.data.items.length === 0 ? null : (
        <ul className="flex flex-col gap-1 text-sm">
          {entries.data.items.map(({ id, title, when }) => (
            <li key={id}>
              {/* Ouvre l'Agenda au bon jour : l'adresse change, `?tache=` part et le détail se ferme. */}
              <Link
                href={agendaHref({ view: null, day: dayOf(when), spaceId: null })}
                className="underline-offset-2 hover:underline"
              >
                <span className="font-semibold">{title}</span>
                <span className="text-muted">
                  {" "}
                  · {dayMonthLabel(dayOf(when))}, {whenLabel(when)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {creating ? (
        <EntryForm
          day={task.dueDate ?? today()}
          fromTask={{ id: task.id, title: task.title, time: task.dueTime }}
          onDone={() => {
            setCreating(false);
          }}
        />
      ) : (
        <Button
          variant="secondary"
          onClick={() => {
            setCreating(true);
          }}
        >
          {AGENDA_LABELS.createSlot}
        </Button>
      )}
    </section>
  );
}
