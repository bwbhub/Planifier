"use client";

import type { SpaceDetailOutput } from "@planifier/api-contract";
import { canAccessSpace, departureOutcome } from "@planifier/domain-access/space";
import { Button, buttonClassName } from "@planifier/ui/components/button";
import { Sheet } from "@planifier/ui/components/sheet";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

import { ConfirmSheet } from "../atoms/confirm-sheet";
import { SectionTitle, SettingCard, SettingRow } from "../atoms/setting-row";
import { peopleCount, SPACE_LABELS } from "../labels";
import { useDeleteSpace, useLeaveSpace } from "../queries/spaces.queries";
import { myMembershipOf } from "../utils/space-membership";
import { MEMBERS_SECTION_ID } from "./members-section";

const TITLE_ID = "quitter";

type OpenSheet = "leave" | "delete" | null;

interface ExitSectionProps {
  space: SpaceDetailOutput;
  meId: string;
}

/** Quitter l'Espace (tout membre) ou le supprimer (propriétaires) ; chaque sortie se confirme. */
export function ExitSection({ space, meId }: ExitSectionProps) {
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const canDelete = canAccessSpace(space.myRole, "delete");
  const close = () => {
    setSheet(null);
  };

  return (
    <section aria-labelledby={TITLE_ID} className="flex flex-col gap-3">
      <SectionTitle id={TITLE_ID}>{canDelete ? "Quitter ou supprimer" : "Quitter"}</SectionTitle>
      <SettingCard label={SPACE_LABELS.leave}>
        <SettingRow title={SPACE_LABELS.leave} hint="Tu ne verras plus ce qui y est partagé.">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSheet("leave");
            }}
          >
            Quitter
          </Button>
        </SettingRow>
        {canDelete ? (
          <SettingRow
            title="Supprimer l'Espace"
            hint="Pour tout le monde. Une confirmation te sera demandée."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSheet("delete");
              }}
            >
              Supprimer
            </Button>
          </SettingRow>
        ) : null}
      </SettingCard>
      {sheet === "leave" ? <LeaveSheet space={space} meId={meId} onClose={close} /> : null}
      {sheet === "delete" ? <DeleteSheet space={space} onClose={close} /> : null}
    </section>
  );
}

/** Retour à la liste une fois l'Espace quitté ou supprimé : la page affichée ne vaut plus pour l'appelant. */
function useReturnToList() {
  const router = useRouter();
  return () => {
    router.replace(ROUTES.spaces);
  };
}

function LeaveSheet({ space, meId, onClose }: ExitSectionProps & { onClose: () => void }) {
  const leave = useLeaveSpace();
  const returnToList = useReturnToList();
  const outcome = departureOutcome(myMembershipOf(space, meId));

  // Le serveur refuserait (LAST_OWNER) : on explique d'abord quoi faire.
  if (outcome === "last_owner") {
    return (
      <Sheet
        open
        onClose={onClose}
        role="alertdialog"
        title="Avant de partir"
        description={
          <p>
            Personne d&apos;autre n&apos;est propriétaire de « {space.name} ». Nomme quelqu&apos;un
            d&apos;autre propriétaire, ou supprime l&apos;Espace si plus personne n&apos;en a
            besoin.
          </p>
        }
      >
        <a
          href={`#${MEMBERS_SECTION_ID}`}
          className={buttonClassName({ variant: "strong" })}
          onClick={onClose}
        >
          Choisir un propriétaire
        </a>
        <Button variant="secondary" onClick={onClose}>
          Rester dans l&apos;Espace
        </Button>
      </Sheet>
    );
  }

  return (
    <ConfirmSheet
      title={`Quitter « ${space.name} » ?`}
      description={
        <p>
          {outcome === "delete_space"
            ? "Tu es la dernière personne de l'Espace : il sera supprimé définitivement."
            : `Tu ne verras plus ce qui y est partagé. ${SPACE_LABELS.comeBackWithLink}`}
        </p>
      }
      confirmLabel={SPACE_LABELS.leave}
      pendingLabel="Départ…"
      cancelLabel="Rester"
      pending={leave.isPending}
      error={leave.error}
      onConfirm={() => {
        leave.mutate({ spaceId: space.id }, { onSuccess: returnToList });
      }}
      onClose={onClose}
    />
  );
}

function DeleteSheet({ space, onClose }: { space: SpaceDetailOutput; onClose: () => void }) {
  const deleteSpace = useDeleteSpace();
  const returnToList = useReturnToList();

  return (
    <ConfirmSheet
      title={`Supprimer « ${space.name} » ?`}
      description={
        <p>
          {space.members.length > 1 ? (
            <>
              L&apos;Espace sera supprimé{" "}
              <strong>pour les {peopleCount(space.members.length)} qui en font partie</strong>.
            </>
          ) : (
            "L'Espace sera supprimé."
          )}{" "}
          Les événements qui y étaient rattachés redeviennent personnels pour leur organisateur, et
          leurs participants gardent leur accès.
        </p>
      }
      confirmLabel="Supprimer définitivement"
      pendingLabel="Suppression…"
      cancelLabel="Garder l'Espace"
      pending={deleteSpace.isPending}
      error={deleteSpace.error}
      onConfirm={() => {
        deleteSpace.mutate({ spaceId: space.id }, { onSuccess: returnToList });
      }}
      onClose={onClose}
    />
  );
}
