import { Button } from "@planifier/ui/components/button";

import { COMMON_LABELS } from "@/lib/labels";

/** Chargement refusé ou réseau coupé : une phrase rassurante et une reprise, annoncées dès leur apparition. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section role="alert" className="flex flex-col gap-3 rounded-card bg-surface p-4.5">
      <p className="leading-relaxed">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        {COMMON_LABELS.retry}
      </Button>
    </section>
  );
}
