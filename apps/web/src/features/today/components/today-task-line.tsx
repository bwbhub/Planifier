import type { TodayTaskOutput } from "@planifier/api-contract";
import { Badge } from "@planifier/ui/components/badge";

import { TaskLine } from "@/features/_shared/components/task-line";
import { TODAY_LABELS } from "../labels";
import { overdueDayLabel } from "../utils/today-day";

interface TodayTaskLineProps {
  task: TodayTaskOutput;
  /** Jour de l'appareil : une échéance passée se dit « Prévue le … », celle du jour seulement son heure. */
  day: string;
  onCheck: (task: TodayTaskOutput) => void;
}

/** Ligne de tâche de l'écran : la pastille de sa liste, et son heure ou son jour. Rien ne se coche seul. */
export function TodayTaskLine({ task, day, onCheck }: TodayTaskLineProps) {
  const { dueDate, dueTime, list } = task;
  const when =
    dueDate !== null && dueDate < day ? TODAY_LABELS.dueOn(overdueDayLabel(dueDate)) : dueTime;
  return (
    <TaskLine
      title={task.title}
      done={false}
      onToggle={() => {
        onCheck(task);
      }}
      details={
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge>
            <span className="sr-only">{TODAY_LABELS.list} </span>
            {list.name}
          </Badge>
          {when === null ? null : <span>{when}</span>}
        </span>
      }
    />
  );
}
