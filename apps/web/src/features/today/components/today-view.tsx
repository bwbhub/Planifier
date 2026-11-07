"use client";

import type { AppModule } from "@planifier/constants/spaces";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { PageHeader } from "@planifier/ui/components/page-header";
import { useSyncExternalStore } from "react";

import { today } from "@/lib/format-date";

import { TODAY_LABELS } from "../labels";
import {
  useCheckTask,
  usePostponeTasks,
  useTodaySlots,
  useTodayTasks,
} from "../queries/today.queries";
import { longDayLabel } from "../utils/today-day";
import { PostponeBar } from "./postpone-bar";
import { RemindersSection } from "./reminders-section";
import { SlotsSection, SlotsSkeleton } from "./slots-section";
import { TaskSection } from "./task-section";

interface TodayViewProps {
  name: string;
  /** Modules activés : une section d'un module désactivé n'est pas montrée et ne lit rien. */
  modules: readonly AppModule[];
}

const noSubscription = () => () => undefined;

/** Jour de l'appareil, connu après l'hydratation seulement : le serveur ne connaît pas son fuseau. */
function useDeviceDay(): string | null {
  return useSyncExternalStore(
    noSubscription,
    () => today(),
    () => null,
  );
}

function AgendaBlock({ day }: { day: string }) {
  const slots = useTodaySlots(day, true);
  if (slots.isError) {
    return (
      <LoadError
        message={TODAY_LABELS.loadFailed}
        retryLabel={TODAY_LABELS.retry}
        onRetry={() => void slots.refetch()}
      />
    );
  }
  if (slots.data === undefined) return <SlotsSkeleton />;
  return <SlotsSection entries={slots.data.pages.flatMap((page) => page.items)} />;
}

function TasksBlock({ day }: { day: string }) {
  const tasks = useTodayTasks(day, true);
  const checkTask = useCheckTask(day);
  const postpone = usePostponeTasks();
  if (tasks.isError) {
    return (
      <LoadError
        message={TODAY_LABELS.loadFailed}
        retryLabel={TODAY_LABELS.retry}
        onRetry={() => void tasks.refetch()}
      />
    );
  }
  if (tasks.data === undefined) return <ListSkeleton label={TODAY_LABELS.loadingTasks} rows={3} />;
  const { dueToday, ongoing, overdue } = tasks.data;
  const failed = checkTask.error !== null || postpone.error !== null;
  return (
    <>
      {failed ? (
        <p role="alert" className="text-accent-text">
          {TODAY_LABELS.actionFailed}
        </p>
      ) : null}
      <TaskSection
        title={TODAY_LABELS.dueTitle}
        empty={{ title: TODAY_LABELS.dueEmptyTitle, hint: TODAY_LABELS.dueEmptyHint }}
        tasks={dueToday.items}
        day={day}
        onCheck={checkTask.check}
      />
      <RemindersSection tasks={dueToday.items} />
      <TaskSection
        title={TODAY_LABELS.ongoingTitle}
        empty={{ title: TODAY_LABELS.ongoingEmptyTitle, hint: TODAY_LABELS.ongoingEmptyHint }}
        tasks={ongoing.items}
        day={day}
        onCheck={checkTask.check}
      />
      <TaskSection
        title={TODAY_LABELS.overdueTitle}
        empty={{ title: TODAY_LABELS.overdueEmptyTitle, hint: TODAY_LABELS.overdueEmptyHint }}
        tasks={overdue.items}
        day={day}
        onCheck={checkTask.check}
        footer={
          <PostponeBar
            tasks={overdue.items}
            day={day}
            pending={postpone.pending}
            onPostpone={postpone.run}
          />
        }
      />
    </>
  );
}

/** Écran Aujourd'hui : l'agenda du jour puis les tâches (du jour, en cours, à reprendre), selon les modules activés. */
export function TodayView({ name, modules }: TodayViewProps) {
  const day = useDeviceDay();
  return (
    <>
      <PageHeader
        title={day === null ? TODAY_LABELS.pageTitle : longDayLabel(day)}
        subtitle={TODAY_LABELS.greeting(name)}
      />
      {day === null ? (
        <ListSkeleton label={TODAY_LABELS.loadingTasks} rows={3} />
      ) : (
        <>
          {modules.includes("AGENDA") ? <AgendaBlock day={day} /> : null}
          {modules.includes("TODO") ? <TasksBlock day={day} /> : null}
        </>
      )}
    </>
  );
}
