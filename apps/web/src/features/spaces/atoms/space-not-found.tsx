import { buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";

import { ROUTES } from "@/lib/routes";

import { MessageCard } from "./message-card";

/** L'Espace n'existe pas pour l'appelant : jamais existé, supprimé, ou quitté. */
export function SpaceNotFound() {
  return (
    <MessageCard title="Cet Espace est introuvable">
      <p className="text-muted">Il a peut-être été supprimé, ou tu n&apos;en fais plus partie.</p>
      <Link href={ROUTES.spaces} className={buttonClassName({ variant: "secondary" })}>
        Voir mes Espaces
      </Link>
    </MessageCard>
  );
}
