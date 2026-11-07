import type { TodayTaskOutput } from "@planifier/api-contract";
import { TitledSection } from "@planifier/ui/components/titled-section";

import { recurrenceLabel } from "@/features/_shared/utils/recurrence-label";
import { TODAY_LABELS } from "../labels";

/** « Rappel du jour » : les tâches répétées dont l'échéance tombe aujourd'hui, dites en texte. Rien s'il n'y en a pas. */
export function RemindersSection({ tasks }: { tasks: readonly TodayTaskOutput[] }) {
  const repeated = tasks.flatMap(({ id, title, recurrence }) =>
    recurrence === null
      ? []
      : [{ id, title, rule: recurrenceLabel(recurrence).toLocaleLowerCase("fr") }],
  );
  if (repeated.length === 0) return null;
  return (
    <TitledSection title={TODAY_LABELS.reminderTitle}>
      <ul className="flex flex-col gap-1 text-muted">
        {repeated.map(({ id, title, rule }) => (
          <li key={id}>{TODAY_LABELS.reminder(title, rule)}</li>
        ))}
      </ul>
    </TitledSection>
  );
}
