"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

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
 * sortie douce. Le focus arrive sur « renoncer » (jamais sur l'action destructive). Avec `acknowledgement`, le bouton
 * reste inactif tant que la case n'est pas cochée.
 *
 * À monter à l'ouverture et à démonter à la fermeture (`{open ? <ConfirmDialog … /> : null}`) : la case cochée ne
 * survit pas à un démontage, une confirmation rouverte repart décochée. Sans métier.
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
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Après l'ouverture modale de `Sheet` (effet enfant, déjà passé) : `showModal` aurait focalisé le premier contrôle.
  useLayoutEffect(() => {
    cancelRef.current?.focus();
  }, []);
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
      <Button ref={cancelRef} variant="secondary" onClick={onClose}>
        {cancelLabel}
      </Button>
    </Sheet>
  );
}
