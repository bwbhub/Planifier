import { buttonClassName } from "@planifier/ui/components/button";
import { EmptyState } from "@planifier/ui/components/empty-state";
import Link from "next/link";

import { ROUTES } from "@/lib/routes";

import { TODAY_LABELS } from "../labels";

/**
 * Rien à montrer : ni Todo ni Agenda. Événements seul n'a pas encore d'écran, on le dit franchement ; sans aucun
 * module, on renvoie vers le profil où ils s'activent.
 */
export function NoModule({ eventsOn }: { eventsOn: boolean }) {
  return (
    <EmptyState
      title={eventsOn ? TODAY_LABELS.eventsSoonTitle : TODAY_LABELS.noModuleTitle}
      description={eventsOn ? TODAY_LABELS.eventsSoonHint : TODAY_LABELS.noModuleHint}
      action={
        <Link href={ROUTES.profile} className={buttonClassName({ variant: "secondary" })}>
          {TODAY_LABELS.openProfile}
        </Link>
      }
    />
  );
}
