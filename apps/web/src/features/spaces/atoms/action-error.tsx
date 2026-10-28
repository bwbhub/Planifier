import { spaceErrorMessage } from "../utils/space-error-message";

/** Refus d'une action sur un Espace, annoncé dès son apparition. Rien sans erreur (`null`). */
export function ActionError({ error }: { error: unknown }) {
  if (error === null) return null;
  return (
    <p role="alert" className="text-accent-text">
      {spaceErrorMessage(error)}
    </p>
  );
}
