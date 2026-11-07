"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { DateTimeField, type DateTimeValue } from "@planifier/ui/components/date-time-field";
import { useState } from "react";

import { useResetKey } from "./use-reset-key";

const LABELS = {
  day: "Échéance",
  time: "Heure",
  noTime: "Sans heure",
} as const;

interface DueFieldsProps {
  task: TaskOutput | undefined;
  /** Message d'erreur du jour (ou de l'heure sans jour) ; absent : aucun. */
  error: string | undefined;
}

function DueFieldsInner({ task, error }: DueFieldsProps) {
  const [value, setValue] = useState<DateTimeValue>({
    date: task?.dueDate ?? null,
    time: task?.dueTime ?? null,
  });
  return (
    <DateTimeField
      label={LABELS.day}
      timeLabel={LABELS.time}
      noTimeLabel={LABELS.noTime}
      dateName="dueDate"
      timeName="dueTime"
      value={value}
      onChange={setValue}
      error={error}
    />
  );
}

/** Échéance du formulaire de tâche : jour, et heure facultative (« Sans heure » par défaut). */
export function DueFields(props: DueFieldsProps) {
  const { ref, key } = useResetKey<HTMLDivElement>();
  return (
    <div ref={ref}>
      <DueFieldsInner key={key} {...props} />
    </div>
  );
}
