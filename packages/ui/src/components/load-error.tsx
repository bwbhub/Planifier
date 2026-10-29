import { Button } from "./button";

/** Chargement refusé ou réseau coupé : une phrase rassurante et une reprise, annoncées dès leur apparition. */
export interface LoadErrorProps {
  message: string;
  /** Libellé de la reprise (« Réessayer »), fourni par l'app : le package n'a pas de textes. */
  retryLabel: string;
  onRetry: () => void;
}

export function LoadError({ message, retryLabel, onRetry }: LoadErrorProps) {
  return (
    <section role="alert" className="flex flex-col gap-3 rounded-card bg-surface p-4.5">
      <p className="leading-relaxed">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </section>
  );
}
