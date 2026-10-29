"use client";

import type { CreatedInviteOutput } from "@planifier/api-contract";
import { SPACE_INVITE_TTL_DAYS } from "@planifier/constants/spaces";
import { Button } from "@planifier/ui/components/button";
import { Sheet } from "@planifier/ui/components/sheet";
import { TextField } from "@planifier/ui/components/text-field";
import { useId, useState } from "react";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { SectionTitle, SettingCard, SettingRow } from "@planifier/ui/components/setting-list";

import { COMMON_LABELS } from "@/lib/labels";
import { formatDay, formatTime } from "@/lib/format-date";

import { ActionError } from "../atoms/action-error";
import { ConfirmSheet } from "../atoms/confirm-sheet";
import { SPACE_LABELS } from "../labels";
import { useCreateInvite, useRevokeInvite, useSpaceInvites } from "../queries/spaces.queries";
import { inviteLinkOf } from "../utils/invite-link";

/** Liens d'invitation de l'Espace (propriétaires) : rien n'est envoyé, le propriétaire partage le lien lui-même. */
export function InvitesSection({ spaceId }: { spaceId: string }) {
  const invites = useSpaceInvites(spaceId);
  const createInvite = useCreateInvite();
  const [created, setCreated] = useState<CreatedInviteOutput | null>(null);
  const [revoking, setRevoking] = useState<RevokedInvite | null>(null);
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <SectionTitle id={titleId}>Inviter</SectionTitle>
      <SettingCard label={SPACE_LABELS.inviteLinks}>
        <SettingRow
          title="Créer un lien d'invitation"
          hint={`Pour une personne, valable ${String(SPACE_INVITE_TTL_DAYS)} jours. Rien n'est envoyé : tu le partages toi-même.`}
        >
          <Button
            size="sm"
            disabled={createInvite.isPending}
            onClick={() => {
              createInvite.mutate({ spaceId }, { onSuccess: setCreated });
            }}
          >
            {createInvite.isPending ? "Création…" : "Créer un lien"}
          </Button>
        </SettingRow>
        {invites.data?.items.map((invite) => {
          const label = `Lien créé le ${formatDay(invite.createdAt)} à ${formatTime(invite.createdAt)}`;
          return (
            <SettingRow
              key={invite.id}
              title={label}
              hint={`Expire le ${formatDay(invite.expiresAt)}`}
            >
              <Button
                variant="outline"
                size="sm"
                aria-label={`Révoquer le ${label.toLowerCase()}`}
                onClick={() => {
                  setRevoking({ id: invite.id, label });
                }}
              >
                Révoquer
              </Button>
            </SettingRow>
          );
        })}
      </SettingCard>
      {invites.isPending ? <ListSkeleton label="Chargement des liens en cours…" rows={1} /> : null}
      {invites.isError ? (
        <LoadError
          retryLabel={COMMON_LABELS.retry}
          message={`Les liens en cours n'ont pas pu être chargés. ${COMMON_LABELS.nothingLost}`}
          onRetry={() => void invites.refetch()}
        />
      ) : null}
      <ActionError error={createInvite.error} />
      {revoking === null ? null : (
        <RevokeInviteSheet
          spaceId={spaceId}
          invite={revoking}
          onClose={() => {
            setRevoking(null);
          }}
        />
      )}
      {created === null ? null : (
        <InviteLinkSheet
          token={created.token}
          onClose={() => {
            setCreated(null);
          }}
        />
      )}
    </section>
  );
}

interface RevokedInvite {
  id: string;
  label: string;
}

/** Révoquer un lien se confirme : un lien déjà envoyé cesserait de marcher sans que la personne le sache. */
function RevokeInviteSheet({
  spaceId,
  invite,
  onClose,
}: {
  spaceId: string;
  invite: RevokedInvite;
  onClose: () => void;
}) {
  const revokeInvite = useRevokeInvite();
  return (
    <ConfirmSheet
      title="Révoquer ce lien ?"
      description={`${invite.label}. Il ne marchera plus ; si quelqu'un l'attend encore, crée-en un autre.`}
      confirmLabel="Révoquer"
      pendingLabel="Révocation…"
      cancelLabel="Garder le lien"
      pending={revokeInvite.isPending}
      error={revokeInvite.error}
      onConfirm={() => {
        revokeInvite.mutate({ spaceId, inviteId: invite.id }, { onSuccess: onClose });
      }}
      onClose={onClose}
    />
  );
}

type CopyState = "idle" | "copied" | "failed";

/** Le lien juste créé, montré une seule fois : le serveur ne garde que son empreinte. */
function InviteLinkSheet({ token, onClose }: { token: string; onClose: () => void }) {
  const [copy, setCopy] = useState<CopyState>("idle");
  const link = inviteLinkOf(window.location.origin, token);
  const canShare = typeof navigator.share === "function";

  return (
    <Sheet
      open
      onClose={onClose}
      title="Ton lien est prêt"
      description={
        <p>
          Envoie-le à <strong>une</strong> personne, par le moyen que tu veux. Il marche une seule
          fois, pendant {SPACE_INVITE_TTL_DAYS} jours.
        </p>
      }
    >
      <TextField
        label={SPACE_LABELS.inviteLink}
        value={link}
        readOnly
        onFocus={(event) => {
          event.currentTarget.select();
        }}
      />
      <p role="status" className="text-sm text-muted">
        {copyMessage(copy)}
      </p>
      <p className="rounded-control bg-field px-3.5 py-3 text-sm text-muted">
        Ce lien ne sera plus affiché. Si tu le perds, révoque-le et crée-en un autre.
      </p>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(link).then(
            () => {
              setCopy("copied");
            },
            () => {
              setCopy("failed");
            },
          );
        }}
      >
        Copier le lien
      </Button>
      {canShare ? (
        <Button
          variant="secondary"
          onClick={() => {
            // Partage annulé par l'utilisateur : rien à signaler, le lien reste affiché.
            navigator
              .share({ title: "Rejoindre mon Espace sur Planifier", url: link })
              .catch(() => undefined);
          }}
        >
          Partager…
        </Button>
      ) : null}
      <Button variant="secondary" onClick={onClose}>
        C&apos;est bon
      </Button>
    </Sheet>
  );
}

function copyMessage(copy: CopyState): string {
  if (copy === "copied") return "Lien copié.";
  if (copy === "failed") return "Copie impossible ici : sélectionne le lien et copie-le.";
  return "";
}
