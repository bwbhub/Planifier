"use client";

import type { SpaceDetailOutput, SpaceMemberOutput } from "@planifier/api-contract";
import { canAccessSpace, removalOutcome, roleChangeOutcome } from "@planifier/domain-access/space";
import { Button } from "@planifier/ui/components/button";
import { Sheet } from "@planifier/ui/components/sheet";
import { useState } from "react";

import { COMMON_LABELS } from "@/lib/labels";
import { formatDay } from "@/lib/format-date";

import { ActionError } from "../atoms/action-error";
import { ConfirmSheet } from "../atoms/confirm-sheet";
import { PersonBadge } from "../atoms/person-badge";
import { RolePill } from "../atoms/role-pill";
import { SectionTitle, SettingCard, SettingRow } from "../atoms/setting-row";
import { SPACE_LABELS, SPACE_ROLE_LABELS } from "../labels";
import { useRemoveMember, useSetMemberRole } from "../queries/spaces.queries";
import { membershipOf } from "../utils/space-membership";

export const MEMBERS_SECTION_ID = "membres";

interface MembersSectionProps {
  space: SpaceDetailOutput;
  meId: string;
}

function memberHint(member: SpaceMemberOutput): string {
  return member.isCreator ? "A créé l'Espace" : `Depuis le ${formatDay(member.joinedAt)}`;
}

/** Membres de l'Espace ; un propriétaire gère les autres, sauf ceux que les règles protègent (le créateur). */
export function MembersSection({ space, meId }: MembersSectionProps) {
  const [managedId, setManagedId] = useState<string | null>(null);
  const canManage = canAccessSpace(space.myRole, "manage_members");
  const managed = space.members.find((member) => member.userId === managedId);

  return (
    <section aria-labelledby={MEMBERS_SECTION_ID} className="flex flex-col gap-3">
      <SectionTitle id={MEMBERS_SECTION_ID}>{SPACE_LABELS.members}</SectionTitle>
      <SettingCard label={SPACE_LABELS.members}>
        {space.members.map((member) => {
          const isMe = member.userId === meId;
          const manageable =
            canManage && !isMe && removalOutcome(membershipOf(space, member)) === "allowed";
          return (
            <SettingRow
              key={member.userId}
              leading={<PersonBadge id={member.userId} name={member.name} />}
              title={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{isMe ? `${member.name} (toi)` : member.name}</span>
                  <RolePill role={member.role} />
                </span>
              }
              hint={memberHint(member)}
            >
              {manageable ? (
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Gérer ${member.name}`}
                  onClick={() => {
                    setManagedId(member.userId);
                  }}
                >
                  Gérer
                </Button>
              ) : null}
            </SettingRow>
          );
        })}
      </SettingCard>
      {managed === undefined ? null : (
        <ManageMemberSheet
          key={managed.userId}
          space={space}
          member={managed}
          onClose={() => {
            setManagedId(null);
          }}
        />
      )}
    </section>
  );
}

interface ManageMemberSheetProps {
  space: SpaceDetailOutput;
  member: SpaceMemberOutput;
  onClose: () => void;
}

/** Changer le rôle d'un membre ou le retirer ; le retrait se confirme. */
function ManageMemberSheet({ space, member, onClose }: ManageMemberSheetProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const setRole = useSetMemberRole();
  const remove = useRemoveMember();
  const pending = setRole.isPending || remove.isPending;
  const target = { spaceId: space.id, userId: member.userId };

  if (confirmRemove) {
    return (
      <ConfirmSheet
        title={`Retirer ${member.name} ?`}
        description={`Cette personne ne verra plus ce qui est partagé dans l'Espace. ${SPACE_LABELS.comeBackWithLink}`}
        confirmLabel={SPACE_LABELS.remove}
        pendingLabel="Retrait…"
        cancelLabel={COMMON_LABELS.cancel}
        pending={pending}
        error={remove.error}
        onConfirm={() => {
          remove.mutate(target, { onSuccess: onClose });
        }}
        onClose={onClose}
      />
    );
  }

  const nextRole = member.role === "MEMBER" ? "OWNER" : "MEMBER";
  const canChangeRole = roleChangeOutcome(membershipOf(space, member), nextRole) === "allowed";
  return (
    <Sheet
      open
      onClose={onClose}
      title={member.name}
      description={
        <p className="text-muted">
          {SPACE_ROLE_LABELS[member.role]} depuis le {formatDay(member.joinedAt)}.
        </p>
      }
    >
      <ActionError error={setRole.error ?? remove.error} />
      {canChangeRole ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setRole.mutate({ ...target, role: nextRole }, { onSuccess: onClose });
          }}
        >
          {nextRole === "OWNER" ? "Nommer propriétaire" : "Retirer le rôle de propriétaire"}
        </Button>
      ) : null}
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          setConfirmRemove(true);
        }}
      >
        {SPACE_LABELS.remove}
      </Button>
      <Button variant="secondary" className="bg-transparent" onClick={onClose}>
        {COMMON_LABELS.cancel}
      </Button>
    </Sheet>
  );
}
