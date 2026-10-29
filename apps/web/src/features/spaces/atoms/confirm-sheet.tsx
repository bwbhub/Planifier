"use client";

import { Button } from "@planifier/ui/components/button";
import { Sheet } from "@planifier/ui/components/sheet";
import type { ReactNode } from "react";

import { ActionError } from "./action-error";

interface ConfirmSheetProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  /** Renoncer : « Rester », « Garder l'Espace »… */
  cancelLabel: string;
  pending: boolean;
  /** Refus de l'action confirmée, `null` sans erreur. */
  error: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation d'une action définitive (quitter, supprimer, retirer) : annoncée comme une alerte. */
export function ConfirmSheet({
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  return (
    <Sheet open onClose={onClose} role="alertdialog" title={title} description={description}>
      <ActionError error={error} />
      <Button variant="strong" disabled={pending} onClick={onConfirm}>
        {pending ? pendingLabel : confirmLabel}
      </Button>
      <Button variant="secondary" onClick={onClose}>
        {cancelLabel}
      </Button>
    </Sheet>
  );
}
