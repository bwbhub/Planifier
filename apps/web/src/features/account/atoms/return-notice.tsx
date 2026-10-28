import { type ReturnPath, ROUTES } from "@/lib/routes";

/** Pourquoi se connecter, quand la connexion ramène ensuite à une page précise. */
const RETURN_NOTICES: Record<ReturnPath, string> = {
  [ROUTES.joinSpace]:
    "Connecte-toi pour rejoindre l'Espace. Pas encore de compte ? Crée-le, puis rouvre le lien d'invitation.",
};

/** Encart de la page de connexion ; rien sans page de retour. */
export function ReturnNotice({ returnTo }: { returnTo: ReturnPath | null }) {
  if (returnTo === null) return null;
  return (
    <p className="mb-4 rounded-control bg-field px-4 py-3 text-sm">{RETURN_NOTICES[returnTo]}</p>
  );
}
