"use client";

import type { InvitePreviewOutput } from "@planifier/api-contract";
import { SPACE_INVITE_TTL_DAYS, SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { Button, buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { MessageCard } from "@planifier/ui/components/message-card";
import { Avatar } from "@planifier/ui/components/avatar";

import { COMMON_LABELS } from "@/lib/labels";
import { ROUTES, spaceRoute } from "@/lib/routes";

import { ActionError } from "../atoms/action-error";
import { peopleCount, SPACE_LABELS } from "../labels";
import { useAcceptInvite, useInvitePreview } from "../queries/spaces.queries";
import { inviteTokenOf } from "../utils/invite-link";
import { isSpaceNotFound, spaceConflictReason } from "../utils/space-error-message";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
  };
}

/** Fragment de l'adresse : lu dans le navigateur seulement, `null` pendant le rendu serveur (il n'y parvient pas). */
function useLocationHash(): string | null {
  return useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => null,
  );
}

/**
 * Jeton du lien d'invitation, lu dans le fragment puis retiré de l'adresse : il ne reste ni dans la barre d'adresse
 * ni dans l'historique, même quand il reste valable (déjà membre, Espace complet). `undefined` avant la lecture.
 */
function useInviteToken(): string | null | undefined {
  const hash = useLocationHash();
  const read = hash === null ? undefined : inviteTokenOf(hash);
  const [kept, setKept] = useState<string | null>(null);
  // Mise à jour pendant le rendu (modèle React) : le jeton survit au fragment vidé ci-dessous.
  if (read !== undefined && read !== null && read !== kept) setKept(read);

  useEffect(() => {
    if (kept === null || window.location.hash === "") return;
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }, [kept]);

  if (read === undefined) return undefined;
  return kept ?? read;
}

const homeLink = (
  <Link
    href={ROUTES.home}
    className={buttonClassName({ variant: "secondary", className: "w-full" })}
  >
    {COMMON_LABELS.goHome}
  </Link>
);

function DeadLink() {
  return (
    <MessageCard level={1} title="Ce lien ne marche plus">
      <p className="text-muted">
        Il a peut-être déjà servi, expiré après {SPACE_INVITE_TTL_DAYS} jours, ou été révoqué.
        Demande un nouveau lien à la personne qui te l&apos;a envoyé.
      </p>
      {homeLink}
    </MessageCard>
  );
}

const opening = <ListSkeleton label={SPACE_LABELS.opening} rows={1} />;

/** Rejoindre un Espace depuis un lien d'invitation : aperçu, puis action explicite. */
export function JoinSpace() {
  const token = useInviteToken();
  const preview = useInvitePreview(token ?? null);

  if (token === undefined) return opening;
  if (token === null) return <DeadLink />;
  if (preview.isPending) return opening;
  if (preview.isError) {
    if (isSpaceNotFound(preview.error)) return <DeadLink />;
    return (
      <LoadError
        retryLabel={COMMON_LABELS.retry}
        message={`L'invitation n'a pas pu être ouverte. ${COMMON_LABELS.nothingLost}`}
        onRetry={() => void preview.refetch()}
      />
    );
  }

  const invite = preview.data;
  if (!invite.alreadyMember) return <InviteCard token={token} invite={invite} />;
  return (
    <MessageCard level={1} title={`Tu fais déjà partie de « ${invite.spaceName} »`}>
      <p className="text-muted">
        Le lien n&apos;a pas été utilisé : il reste valable pour quelqu&apos;un d&apos;autre.
      </p>
      <Link href={spaceRoute(invite.spaceId)} className={buttonClassName({ className: "w-full" })}>
        {SPACE_LABELS.open}
      </Link>
    </MessageCard>
  );
}

/** L'Espace auquel le lien invite, et le choix de le rejoindre ou non. */
function InviteCard({ token, invite }: { token: string; invite: InvitePreviewOutput }) {
  const router = useRouter();
  const accept = useAcceptInvite();

  if (spaceConflictReason(accept.error) === "SPACE_FULL") {
    return (
      <MessageCard level={1} title="Cet Espace est complet">
        <p className="text-muted">
          Il compte déjà {SPACE_MAX_MEMBERS} personnes, le maximum. Préviens la personne qui
          t&apos;a envoyé le lien.
        </p>
        {homeLink}
      </MessageCard>
    );
  }

  return (
    <MessageCard>
      <Avatar id={invite.spaceId} name={invite.spaceName} size="lg" />
      <p className="text-sm text-muted">On t&apos;invite dans un Espace</p>
      <h1 className="font-display text-3xl font-bold tracking-tight wrap-break-word">
        {invite.spaceName}
      </h1>
      <p className="text-muted">
        {peopleCount(invite.memberCount)} en {invite.memberCount > 1 ? "font" : "fait"} déjà partie.
        Tu verras ce qui y est partagé, et les membres verront ce que tu y mets.
      </p>
      <ActionError error={accept.error} />
      <Button
        className="w-full"
        disabled={accept.isPending}
        onClick={() => {
          accept.mutate(
            { token },
            {
              // `replace` : le lien, jeton compris, quitte l'historique du navigateur.
              onSuccess: ({ spaceId }) => {
                router.replace(spaceRoute(spaceId));
              },
            },
          );
        }}
      >
        {accept.isPending ? "Un instant…" : SPACE_LABELS.join}
      </Button>
      <Link
        href={ROUTES.home}
        replace
        className={buttonClassName({ variant: "secondary", className: "w-full" })}
      >
        Pas maintenant
      </Link>
    </MessageCard>
  );
}
