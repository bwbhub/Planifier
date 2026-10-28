"use client";

import { Button } from "@planifier/ui/components/button";

interface ConfirmDeleteProps {
  /** Question posée, qui nomme ce qui sera supprimé. */
  question: string;
  confirmLabel: string;
  keepLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onKeep: () => void;
}

/** Confirmation d'une suppression définitive, sur place : action nommée et sortie douce. */
export function ConfirmDelete({
  question,
  confirmLabel,
  keepLabel,
  pending,
  onConfirm,
  onKeep,
}: ConfirmDeleteProps) {
  return (
    <div
      role="group"
      aria-label={question}
      className="flex flex-col gap-3 rounded-control bg-field p-4"
    >
      <p className="font-semibold">{question}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onKeep} autoFocus>
          {keepLabel}
        </Button>
      </div>
    </div>
  );
}
