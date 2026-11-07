"use client";

import type { TodayTaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { TitledSection } from "@planifier/ui/components/titled-section";
import { type ReactNode, useState } from "react";

import { TODAY_LABELS } from "../labels";
import { TodayTaskLine } from "./today-task-line";

/** Tâches montrées d'abord ; le reste se déroule sur place. */
export const SECTION_PREVIEW = 5;

interface TaskSectionProps {
  title: string;
  empty: { title: string; hint: string };
  tasks: readonly TodayTaskOutput[];
  day: string;
  onCheck: (task: TodayTaskOutput) => void;
  /** Sous la liste (report des tâches en retard). */
  footer?: ReactNode;
}

/** Section de tâches : les premières, puis « Voir les N autres » qui déroule sur place. Vide : une phrase utile. */
export function TaskSection({ title, empty, tasks, day, onCheck, footer }: TaskSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? tasks : tasks.slice(0, SECTION_PREVIEW);
  const hidden = tasks.length - SECTION_PREVIEW;
  return (
    <TitledSection title={title}>
      {tasks.length === 0 ? (
        <EmptyState level={3} title={empty.title} description={empty.hint} />
      ) : (
        <>
          <ul className="flex flex-col">
            {shown.map((task) => (
              <li key={task.id}>
                <TodayTaskLine task={task} day={day} onCheck={onCheck} />
              </li>
            ))}
          </ul>
          {hidden <= 0 ? null : (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              onClick={() => {
                setExpanded(!expanded);
              }}
            >
              {expanded ? TODAY_LABELS.showLess : TODAY_LABELS.showMore(hidden)}
            </Button>
          )}
          {footer}
        </>
      )}
    </TitledSection>
  );
}
