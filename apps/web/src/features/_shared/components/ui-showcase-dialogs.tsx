"use client";

import { Button } from "@planifier/ui/components/button";
import { ConfirmDialog } from "@planifier/ui/components/confirm-dialog";
import { Sheet } from "@planifier/ui/components/sheet";
import { TextAreaField } from "@planifier/ui/components/text-area-field";
import { TextField } from "@planifier/ui/components/text-field";
import { useState } from "react";

type Opened = "confirm" | "strong" | "form" | null;

/** Les dialogues de `packages/ui`, ouverts à la demande sur la page de référence. */
export function DialogsDemo() {
  const [dialog, setDialog] = useState<Opened>(null);
  const closeDialog = () => {
    setDialog(null);
  };
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setDialog("confirm");
          }}
        >
          Confirmation
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDialog("strong");
          }}
        >
          Confirmation renforcée
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDialog("form");
          }}
        >
          Feuille de formulaire
        </Button>
      </div>
      {dialog === "confirm" || dialog === "strong" ? (
        <ConfirmDialog
          title="Supprimer la tâche ?"
          description="Ses sous-tâches partent avec elle."
          confirmLabel="Supprimer définitivement"
          pendingLabel="Suppression…"
          cancelLabel="Garder la tâche"
          pending={false}
          acknowledgement={dialog === "strong" ? "Je comprends que c'est définitif" : undefined}
          onConfirm={closeDialog}
          onClose={closeDialog}
        />
      ) : null}
      {dialog === "form" ? (
        <Sheet open size="form" title="Nouvelle tâche" onClose={closeDialog}>
          <TextField label="Titre" name="title" />
          <TextAreaField label="Description" name="description" />
          <Button onClick={closeDialog}>Ajouter</Button>
        </Sheet>
      ) : null}
    </>
  );
}
