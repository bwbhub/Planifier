import { Button } from "./button";

export interface ConfirmPanelProps {
  /** Question posée, qui nomme ce qui sera touché. */
  question: string;
  /** Action nommée (« Supprimer définitivement »). */
  confirmLabel: string;
  /** Sortie douce (« Garder la liste »), qui reçoit le focus. */
  keepLabel: string;
  pending?: boolean | undefined;
  onConfirm: () => void;
  onKeep: () => void;
}

/**
 * Confirmation sur place d'une action à conséquence (suppression définitive) : question, action nommée, sortie
 * douce. Le focus va à la sortie : Entrée par réflexe ne détruit rien.
 */
export function ConfirmPanel({
  question,
  confirmLabel,
  keepLabel,
  pending = false,
  onConfirm,
  onKeep,
}: ConfirmPanelProps) {
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
        <Button variant="surface" onClick={onKeep} autoFocus>
          {keepLabel}
        </Button>
      </div>
    </div>
  );
}
