"use client";

import { Button } from "@planifier/ui/components/button";
import { useToast } from "@planifier/ui/components/toast";

/** Les messages de `packages/ui` (confirmation avec action, erreur), déclenchés à la demande. */
export function ToastsDemo() {
  const { notify } = useToast();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        onClick={() => {
          notify("Tâche reportée à aujourd'hui.", {
            action: { label: "Annuler", onAction: () => undefined },
          });
        }}
      >
        Message avec action
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          notify("Rien n'a été envoyé. Réessaie dans un instant.", { tone: "error" });
        }}
      >
        Message d&apos;erreur
      </Button>
    </div>
  );
}
