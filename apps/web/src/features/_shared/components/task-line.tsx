import { Avatar } from "@planifier/ui/components/avatar";
import { Badge } from "@planifier/ui/components/badge";
import type { ReactNode } from "react";

import { TASK_LABELS } from "@/lib/labels";

export interface TaskLineProps {
  title: string;
  done: boolean;
  /** Cocher ou décocher, au geste de l'utilisateur. Absent : la case montre l'état, sans geste possible. */
  onToggle?: ((done: boolean) => void) | undefined;
  /** Atténuée : pas pour moi (« Atténuer les tâches qui ne me sont pas assignées »). */
  dimmed?: boolean | undefined;
  /** Sous-tâches : pastille « 2/4 ». `label` la dit en toutes lettres aux lecteurs d'écran. */
  subtasks?: { done: number; total: number; label: string } | undefined;
  assignee?: { userId: string; name: string } | null | undefined;
  /** Nom de la personne qui a coché, liste partagée : « Cochée par … ». */
  completedByName?: string | undefined;
  /** Lignes sous le titre : échéance, répétition, description… */
  details?: ReactNode;
  /** Actions de la ligne (menu, boutons), à droite sur grand écran. */
  actions?: ReactNode;
}

/**
 * Ligne de tâche, partagée par le Todo et l'écran Aujourd'hui : case à gauche, titre, puis ce qui la précise. Pure
 * présentation : aucune requête, la coche et les actions viennent de l'appelant. Rien ne se coche seul.
 */
export function TaskLine({
  title,
  done,
  onToggle,
  dimmed = false,
  subtasks,
  assignee,
  completedByName,
  details,
  actions,
}: TaskLineProps) {
  return (
    <div
      data-dimmed={dimmed ? true : undefined}
      className="flex flex-col data-dimmed:opacity-45 sm:flex-row sm:items-start sm:gap-3"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <label className="flex min-h-11 items-start gap-3 pt-2.5 has-enabled:cursor-pointer">
          <input
            type="checkbox"
            checked={done}
            disabled={onToggle === undefined}
            onChange={(event) => {
              onToggle?.(event.target.checked);
            }}
            className="mt-0.5 size-5 shrink-0 accent-accent enabled:cursor-pointer"
          />
          <span className={done ? "text-muted line-through" : "font-semibold"}>{title}</span>
        </label>
        <div className="flex flex-col items-start gap-0.5 pl-8">
          {details}
          {subtasks === undefined ? null : (
            <Badge>
              <span aria-hidden="true">
                {String(subtasks.done)}/{String(subtasks.total)}
              </span>
              <span className="sr-only">{subtasks.label}</span>
            </Badge>
          )}
          {assignee === null || assignee === undefined ? null : (
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <Avatar id={assignee.userId} name={assignee.name} size="sm" />
              {TASK_LABELS.assignedTo} {assignee.name}
            </span>
          )}
          {completedByName === undefined ? null : (
            <span className="text-sm text-muted">
              {TASK_LABELS.checkedBy} {completedByName}
            </span>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}
