import { type ReturnPath, returnNoticeOf } from "@/lib/routes";

/** Encart de la page de connexion : pourquoi se connecter ; rien sans page de retour. */
export function ReturnNotice({ returnTo }: { returnTo: ReturnPath | null }) {
  if (returnTo === null) return null;
  return (
    <p className="mb-4 rounded-control bg-field px-4 py-3 text-sm">{returnNoticeOf(returnTo)}</p>
  );
}
