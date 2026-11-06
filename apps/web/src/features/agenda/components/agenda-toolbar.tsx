"use client";

import type { SpaceMemberOutput } from "@planifier/api-contract";
import { AGENDA_VIEWS, type AgendaView } from "@planifier/constants/agenda";
import { stepDay } from "@planifier/domain-agenda/view-days";
import { Avatar } from "@planifier/ui/components/avatar";
import { Button, buttonClassName } from "@planifier/ui/components/button";
import { LoadError } from "@planifier/ui/components/load-error";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";

import { COMMON_LABELS } from "@/lib/labels";

import { AGENDA_LABELS } from "../labels";
import { useAgendaSpaces } from "../queries/agenda.queries";
import { agendaHref, type AgendaParams, VIEWS } from "../utils/agenda-params";

/** Échec de lecture d'une partie de l'écran : la grille reste utilisable. */
export function ReadError({ onRetry }: { onRetry: () => void }) {
  return (
    <LoadError
      message={`${AGENDA_LABELS.loadFailed} ${COMMON_LABELS.nothingLost}`}
      retryLabel={COMMON_LABELS.retry}
      onRetry={onRetry}
    />
  );
}

interface ToolbarProps {
  params: AgendaParams & { view: AgendaView; day: string };
  today: string;
  onCreate: () => void;
}

const PILL = "inline-flex min-h-11 items-center rounded-pill bg-surface px-4 text-sm font-semibold";

export function Toolbar({ params, today, onCreate }: ToolbarProps) {
  const { view, day } = params;
  const hrefAt = (target: string) => agendaHref({ ...params, day: target });
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <nav aria-label="Période" className="flex gap-0.5">
        <Link
          href={hrefAt(stepDay(view, day, -1))}
          aria-label="Période précédente"
          className={cn(PILL, "w-11 justify-center px-0")}
        >
          ‹
        </Link>
        <Link href={hrefAt(today)} className={PILL}>
          Aujourd&apos;hui
        </Link>
        <Link
          href={hrefAt(stepDay(view, day, 1))}
          aria-label="Période suivante"
          className={cn(PILL, "w-11 justify-center px-0")}
        >
          ›
        </Link>
      </nav>
      <nav aria-label="Vue" className="flex gap-1 rounded-pill bg-surface p-1">
        {AGENDA_VIEWS.map((option) => (
          <Link
            key={option}
            href={agendaHref({ ...params, view: option })}
            aria-current={option === view ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-pill px-4 text-sm font-medium",
              option === view && "bg-ink font-semibold text-surface",
            )}
          >
            {VIEWS[option].label}
          </Link>
        ))}
      </nav>
      {/* Sur mobile, le bouton flotte au-dessus de la grille (maquette). */}
      <Button
        className="max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(var(--nav-height,0px)+1rem)] max-sm:z-30"
        onClick={onCreate}
      >
        + {AGENDA_LABELS.newEntry}
      </Button>
    </div>
  );
}

export function SpaceChoice({ params }: { params: AgendaParams }) {
  const { data, error, refetch } = useAgendaSpaces();
  if (error !== null) {
    return (
      <ReadError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  const spaces = data?.items.filter(({ modules }) => modules.includes("AGENDA")) ?? [];
  if (spaces.length === 0) return null;
  const choices = [{ id: null, name: "Mon agenda" }, ...spaces];
  return (
    <nav aria-label="Agenda affiché" className="flex flex-wrap gap-2">
      {choices.map(({ id, name }) => (
        <Link
          key={id ?? "mine"}
          href={agendaHref({ ...params, spaceId: id })}
          aria-current={id === params.spaceId ? "page" : undefined}
          className={buttonClassName({
            variant: id === params.spaceId ? "strong" : "secondary",
            size: "sm",
          })}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}

interface PeopleFilterProps {
  people: readonly SpaceMemberOutput[];
  hiddenPeople: ReadonlySet<string>;
  onToggle: (userId: string) => void;
}

/** Filtres par personne : une personne masquée garde sa pastille, en pointillés (maquette). */
export function PeopleFilter({ people, hiddenPeople, onToggle }: PeopleFilterProps) {
  return (
    <div role="group" aria-label="Agendas affichés" className="flex flex-wrap gap-2">
      {people.map(({ userId, name }) => {
        const shown = !hiddenPeople.has(userId);
        return (
          <button
            key={userId}
            type="button"
            aria-pressed={shown}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-pill border-2 bg-surface pr-4 pl-1.5 text-sm font-medium",
              shown ? "border-ink" : "border-dashed border-muted opacity-75",
            )}
            onClick={() => {
              onToggle(userId);
            }}
          >
            <Avatar id={userId} name={name} size="sm" />
            {name}
          </button>
        );
      })}
    </div>
  );
}
