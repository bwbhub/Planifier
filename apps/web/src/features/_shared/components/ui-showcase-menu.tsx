"use client";

import { Menu } from "@planifier/ui/components/menu";
import { useToast } from "@planifier/ui/components/toast";

/** Le menu d'actions de `packages/ui` : chaque action répond par un message. */
export function MenuDemo() {
  const { notify } = useToast();
  return (
    <Menu
      label="Actions de la tâche d'exemple"
      trigger="Actions"
      items={[
        {
          key: "edit",
          label: "Modifier",
          onSelect: () => {
            notify("Modifier choisi.");
          },
        },
        {
          key: "postpone",
          label: "Reporter à demain",
          onSelect: () => {
            notify("Tâche reportée à demain.", {
              action: { label: "Annuler", onAction: () => undefined },
            });
          },
        },
        {
          key: "locked",
          label: "Supprimer (indisponible)",
          onSelect: () => undefined,
          disabled: true,
        },
      ]}
    />
  );
}
