import { authErrorMessage } from "../utils/auth-error-message";

/** Refus d'une action de session, annoncé aux lecteurs d'écran dès son apparition. */
export function AuthErrorAlert({ error }: { error: unknown }) {
  return (
    <p role="alert" className="text-sm text-accent-text">
      {authErrorMessage(error)}
    </p>
  );
}
