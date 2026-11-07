import type { AgendaEntryOutput } from "@planifier/api-contract";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { TitledSection } from "@planifier/ui/components/titled-section";

import { SlotBlock } from "@/features/_shared/components/slot-block";
import { TINTS } from "@/features/_shared/utils/tints";
import { TODAY_LABELS } from "../labels";
import { slotTimeLabel, sortedSlots } from "../utils/today-day";

interface SlotsSectionProps {
  entries: readonly AgendaEntryOutput[];
}

/** « Au fil de la journée » : les rendez-vous du jour, par heure. Lecture seule ici : la modification est dans l'Agenda. */
export function SlotsSection({ entries }: SlotsSectionProps) {
  return (
    <TitledSection title={TODAY_LABELS.slotsTitle}>
      {entries.length === 0 ? (
        <EmptyState
          level={3}
          title={TODAY_LABELS.slotsEmptyTitle}
          description={TODAY_LABELS.slotsEmptyHint}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedSlots(entries).map((entry) => (
            <li key={entry.id}>
              <SlotBlock
                interactive={false}
                title={entry.title}
                time={slotTimeLabel(entry)}
                background={TINTS[entry.tint].background}
                hidden={entry.hidden}
              >
                {entry.location === null ? null : (
                  <span className="text-muted">{entry.location}</span>
                )}
              </SlotBlock>
            </li>
          ))}
        </ul>
      )}
    </TitledSection>
  );
}

export function SlotsSkeleton() {
  return <ListSkeleton label={TODAY_LABELS.loadingSlots} />;
}
