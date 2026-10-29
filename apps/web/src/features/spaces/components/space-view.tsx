"use client";

import type { SpaceDetailOutput } from "@planifier/api-contract";
import { MODULES } from "@planifier/constants/spaces";
import { canAccessSpace } from "@planifier/domain-access/space";
import { buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";
import { useId } from "react";
import { SectionTitle, SettingCard, SettingRow } from "@planifier/ui/components/setting-list";

import { spaceSettingsRoute } from "@/lib/routes";

import { SpaceHeader } from "../atoms/space-header";
import { peopleCount, SPACE_LABELS, SPACE_MODULE_LABELS, VISIBILITY_LABELS } from "../labels";
import { ExitSection } from "./exit-section";
import { InvitesSection } from "./invites-section";
import { MembersSection } from "./members-section";
import { PromotionTip } from "./promotion-tip";
import { SpaceGate } from "./space-gate";

interface SpaceViewProps {
  spaceId: string;
  /** Utilisateur de la session : repère « (toi) » parmi les membres. */
  meId: string;
}

/** Un Espace : membres, invitations et réglages pour les propriétaires, sortie pour tous. */
export function SpaceView({ spaceId, meId }: SpaceViewProps) {
  return (
    <SpaceGate spaceId={spaceId} rows={4}>
      {(space) => (
        <div className="flex flex-col gap-3">
          <SpaceHeader
            spaceId={space.id}
            name={space.name}
            meta={`${peopleCount(space.members.length)} · ${modulesSummary(space)}`}
            members={space.members}
          />
          <PromotionTip space={space} />
          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            <div className="flex min-w-0 flex-col gap-3">
              <MembersSection space={space} meId={meId} />
              {canAccessSpace(space.myRole, "invite") ? (
                <InvitesSection spaceId={space.id} />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <SettingsSummary space={space} />
              <ExitSection space={space} meId={meId} />
            </div>
          </div>
        </div>
      )}
    </SpaceGate>
  );
}

function modulesSummary(space: SpaceDetailOutput): string {
  if (space.modules.length === 0) return SPACE_LABELS.noModules;
  return MODULES.filter((module) => space.modules.includes(module))
    .map((module) => SPACE_MODULE_LABELS[module].label)
    .join(", ");
}

/** Réglages en lecture ; seuls les propriétaires les modifient, dans le formulaire de l'Espace. */
function SettingsSummary({ space }: { space: SpaceDetailOutput }) {
  const visibility = space.restrictVisibility
    ? VISIBILITY_LABELS.restricted
    : VISIBILITY_LABELS.open;
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <SectionTitle id={titleId}>Réglages</SectionTitle>
      <SettingCard label="Réglages">
        {MODULES.map((module) => (
          <SettingRow
            key={module}
            title={SPACE_MODULE_LABELS[module].label}
            hint={SPACE_MODULE_LABELS[module].hint}
          >
            <span className="shrink-0 text-sm text-muted">
              {space.modules.includes(module) ? "Activé" : "Désactivé"}
            </span>
          </SettingRow>
        ))}
        <SettingRow title={VISIBILITY_LABELS.title} hint={visibility.hint}>
          <span className="shrink-0 text-sm text-muted">{visibility.value}</span>
        </SettingRow>
      </SettingCard>
      {canAccessSpace(space.myRole, "update") ? (
        <Link
          href={spaceSettingsRoute(space.id)}
          className={buttonClassName({ variant: "secondary" })}
        >
          Modifier les réglages
        </Link>
      ) : (
        <p className="mx-1.5 text-sm text-muted">Seuls les propriétaires changent les réglages.</p>
      )}
    </section>
  );
}
