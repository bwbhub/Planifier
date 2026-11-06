"use client";

import { type ReactNode, useState } from "react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Sheet } from "./sheet";

export interface ConfirmDialogProps {
  title: string;
  /** Ce que l'action change, en clair : lu avec le titre à l'ouverture. */
  description: ReactNode;
  confirmLabel: string;
  /** Libellé du bouton pendant l'envoi. */
  pendingLabel: string;
  /** Renoncer, nommé pour ce qu'on garde : « Garder la tâche », « Rester ». */
  cancelLabel: string;
  pending: boolean;
  /** Refus de l'action confirmée (déjà annoncé par son propre `role="alert"`). */
  error?: ReactNode;
  /**
   * Confirmation renforcée : phrase à cocher avant de pouvoir confirmer (« Je comprends que… »). Absente : un seul
   * clic suffit.
   */
  acknowledgement?: string | undefined;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation d'une action définitive (supprimer, retirer, désactiver) : annoncée comme une alerte, action nommée et
 * sortie douce. Avec `acknowledgement`, le bouton reste inactif tant que la case n'est pas cochée. Sans métier.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  pending,
  error,
  acknowledgement,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const blocked = acknowledgement !== undefined && !acknowledged;
  return (
    <Sheet open onClose={onClose} role="alertdialog" title={title} description={description}>
      {acknowledgement === undefined ? null : (
        <Checkbox
          label={acknowledgement}
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
          }}
        />
      )}
      {error}
      <Button variant="strong" disabled={pending || blocked} onClick={onConfirm}>
        {pending ? pendingLabel : confirmLabel}
      </Button>
      <Button variant="secondary" onClick={onClose}>
        {cancelLabel}
      </Button>
    </Sheet>
  );
}
