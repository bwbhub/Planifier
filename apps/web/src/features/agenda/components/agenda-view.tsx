"use client";

import type { AgendaView as View } from "@planifier/constants/agenda";
import { viewDays } from "@planifier/domain-agenda/view-days";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { Sheet } from "@planifier/ui/components/sheet";
import { useMemo, useState, useSyncExternalStore } from "react";

import { today as deviceToday } from "@/lib/format-date";
import { COMMON_LABELS } from "@/lib/labels";

import { EntryForm } from "../forms/entry-form";
import { AGENDA_LABELS } from "../labels";
import { useMyEntries, useSpaceEntries, useSpacePeople } from "../queries/agenda.queries";
import { periodLabel } from "../utils/agenda-dates";
import { agendaErrorMessage } from "../utils/agenda-error-message";
import {
  type AgendaItem,
  dayContent,
  fromMyEntry,
  fromSpaceEntry,
  windowOf,
} from "../utils/agenda-items";
import { agendaHref, type AgendaParams } from "../utils/agenda-params";
import { PeopleFilter, ReadError, SpaceChoice, Toolbar } from "./agenda-toolbar";
import { MonthGrid } from "./month-grid";
import { TimeGrid } from "./time-grid";

const NARROW_SCREEN = "(max-width: 639px)";
const noSubscription = () => () => undefined;

/** Jour de l'appareil, connu seulement dans le navigateur : `null` au rendu serveur. */
function useToday(): string | null {
  return useSyncExternalStore(noSubscription, deviceToday, () => null);
}

function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW_SCREEN);
      query.addEventListener("change", onChange);
      return () => {
        query.removeEventListener("change", onChange);
      };
    },
    () => window.matchMedia(NARROW_SCREEN).matches,
    () => false,
  );
}

interface PeopleSectionProps {
  spaceId: string | null;
  hiddenPeople: ReadonlySet<string>;
  onToggle: (userId: string) => void;
}

/** Personnes de l'Espace affiché. Espace restreint : chacun n'y voit que ses entrées, rien à filtrer. */
function PeopleSection({ spaceId, hiddenPeople, onToggle }: PeopleSectionProps) {
  const { data, error, refetch } = useSpacePeople(spaceId);
  if (error !== null) {
    return (
      <ReadError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (data === undefined) return null;
  if (data.restrictVisibility)
    return <p className="text-sm text-muted">{AGENDA_LABELS.onlyMine}</p>;
  return <PeopleFilter people={data.members} hiddenPeople={hiddenPeople} onToggle={onToggle} />;
}

function useHiddenPeople() {
  const [hiddenPeople, setHiddenPeople] = useState<ReadonlySet<string>>(new Set());
  function toggle(userId: string) {
    setHiddenPeople((current) => {
      const next = new Set(current);
      if (!next.delete(userId)) next.add(userId);
      return next;
    });
  }
  return { hiddenPeople, toggle };
}

/** Ce que la grille affiche : mon agenda, ou la vue fusionnée de l'Espace choisi. */
function useAgendaItems(days: readonly string[] | null, spaceId: string | null) {
  const period = useMemo(() => (days === null ? null : windowOf(days)), [days]);
  const mine = useMyEntries(spaceId === null ? period : null);
  const shared = useSpaceEntries(period, spaceId);
  const query = spaceId === null ? mine : shared;
  const items: AgendaItem[] =
    spaceId === null
      ? (mine.data?.pages.flatMap(({ items: page }) => page.map(fromMyEntry)) ?? [])
      : (shared.data?.pages.flatMap(({ items: page }) => page.map(fromSpaceEntry)) ?? []);
  return { items, isPending: query.isPending, error: query.error, refetch: query.refetch };
}

function AgendaTitle({ period }: { period: string | null }) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h1 className="font-display text-3xl font-bold tracking-tight">{AGENDA_LABELS.title}</h1>
      {period === null ? null : <p className="text-lg text-muted">{period}</p>}
    </header>
  );
}

type SheetState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; item: AgendaItem };

interface EntrySheetProps {
  sheet: SheetState;
  day: string;
  onClose: () => void;
}

function EntrySheet({ sheet, day, onClose }: EntrySheetProps) {
  const entry = sheet.kind === "edit" ? (sheet.item.entry ?? undefined) : undefined;
  return (
    <Sheet
      open={sheet.kind !== "closed"}
      onClose={onClose}
      title={entry === undefined ? AGENDA_LABELS.newEntry : AGENDA_LABELS.editEntry}
    >
      {sheet.kind === "closed" ? null : (
        <EntryForm key={entry?.id ?? "create"} entry={entry} day={day} onDone={onClose} />
      )}
    </Sheet>
  );
}

interface AgendaGridProps {
  view: View;
  day: string;
  days: readonly string[];
  today: string;
  items: readonly AgendaItem[];
  dayHref: (day: string) => string;
  onOpen: (item: AgendaItem) => void;
}

/** Grille de la période, précédée d'un mot quand elle est vide. */
function AgendaBody({
  view,
  isPending,
  onOpen,
  ...grid
}: AgendaGridProps & { isPending: boolean }) {
  if (isPending) return <ListSkeleton label={AGENDA_LABELS.loading} rows={4} />;
  return (
    <>
      {grid.items.length === 0 ? (
        <p className="text-sm text-muted">{AGENDA_LABELS.nothingPlanned}</p>
      ) : null}
      {view === "MONTH" ? <MonthGrid {...grid} /> : <TimeGrid {...grid} onOpen={onOpen} />}
    </>
  );
}

interface ShownPeriod {
  today: string;
  view: View;
  day: string;
  days: readonly string[];
}

/** Vue et jour affichés : ceux de l'adresse, sinon ceux de l'appareil. `null` tant que le jour n'est pas connu. */
function useShownPeriod({ view, day }: Pick<AgendaParams, "view" | "day">): ShownPeriod | null {
  const today = useToday();
  const narrow = useNarrowScreen();
  const shownView = view ?? (narrow ? "DAY" : "WEEK");
  const shownDay = day ?? today;
  return useMemo(
    () =>
      today === null || shownDay === null
        ? null
        : {
            today,
            view: shownView,
            day: shownDay,
            days: viewDays(shownView, shownDay),
          },
    [today, shownView, shownDay],
  );
}

/** Période du titre ; la vue Jour dit en plus combien de créneaux elle compte (maquette). */
function titleOf({ view, days, day }: ShownPeriod, items: readonly AgendaItem[]): string {
  const label = periodLabel(view, days, day);
  if (view !== "DAY") return label;
  const { allDay, slots } = dayContent(items, day);
  const count = allDay.length + slots.length;
  if (count === 0) return label;
  return `${label} · ${String(count)} créneau${count > 1 ? "x" : ""}`;
}

/** Écran Agenda : période et vue dans l'adresse, mon agenda ou la vue fusionnée d'un Espace. */
export function AgendaView({ view, day, spaceId }: AgendaParams) {
  const period = useShownPeriod({ view, day });
  const { items, isPending, error, refetch } = useAgendaItems(period?.days ?? null, spaceId);
  const { hiddenPeople, toggle } = useHiddenPeople();
  const [sheet, setSheet] = useState<SheetState>({ kind: "closed" });

  if (period === null) {
    return (
      <>
        <AgendaTitle period={null} />
        <ListSkeleton label={AGENDA_LABELS.loading} rows={4} />
      </>
    );
  }
  const params = { view: period.view, day: period.day, spaceId };
  const shown = items.filter(({ owner }) => owner === null || !hiddenPeople.has(owner.userId));
  const dayHref = (target: string) => agendaHref({ ...params, view: "DAY", day: target });
  const onOpen = (item: AgendaItem) => {
    if (item.entry !== null) setSheet({ kind: "edit", item });
  };

  return (
    <div className="flex flex-col gap-4">
      <AgendaTitle period={titleOf(period, shown)} />
      <Toolbar
        params={params}
        today={period.today}
        onCreate={() => {
          setSheet({ kind: "create" });
        }}
      />
      <SpaceChoice params={params} />
      <PeopleSection spaceId={spaceId} hiddenPeople={hiddenPeople} onToggle={toggle} />
      {error === null ? null : (
        <LoadError
          message={agendaErrorMessage(error)}
          retryLabel={COMMON_LABELS.retry}
          onRetry={() => {
            void refetch();
          }}
        />
      )}
      {error === null ? (
        <AgendaBody
          {...period}
          isPending={isPending}
          items={shown}
          dayHref={dayHref}
          onOpen={onOpen}
        />
      ) : null}
      <EntrySheet
        sheet={sheet}
        day={period.day}
        onClose={() => {
          setSheet({ kind: "closed" });
        }}
      />
    </div>
  );
}
