import { useRouter } from "next/navigation";

/**
 * Navigation après un changement de session (connexion, inscription, déconnexion) : remplace l'entrée d'historique
 * et refait le rendu serveur, pour que les gardes des layouts relisent la nouvelle session.
 */
export function useSessionRedirect() {
  const router = useRouter();
  return (path: string) => {
    router.replace(path);
    router.refresh();
  };
}
