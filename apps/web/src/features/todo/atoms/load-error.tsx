import { Button } from "@planifier/ui/components/button";

import { TodoErrorAlert } from "./todo-error-alert";

/** Chargement refusé : message rassurant et reprise. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <TodoErrorAlert error={error} />
      <Button variant="secondary" onClick={onRetry}>
        Réessayer maintenant
      </Button>
    </div>
  );
}
