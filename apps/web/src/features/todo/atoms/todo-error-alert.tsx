import { todoErrorMessage } from "../utils/todo-error-message";

/** Refus d'une action Todo, annoncé aux lecteurs d'écran dès son apparition. */
export function TodoErrorAlert({ error }: { error: unknown }) {
  return (
    <p role="alert" className="text-sm text-accent-text">
      {todoErrorMessage(error)}
    </p>
  );
}
