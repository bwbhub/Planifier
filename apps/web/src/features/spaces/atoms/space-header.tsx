import type { SpaceMemberOutput } from "@planifier/api-contract";
import { cn } from "@planifier/ui/lib/cn";

import { tintOf } from "../utils/tint";
import { PersonBadge } from "./person-badge";

const MAX_BADGES = 5;

interface SpaceHeaderProps {
  spaceId: string;
  name: string;
  /** Ligne de contexte : nombre de personnes, modules. */
  meta: string;
  members: readonly SpaceMemberOutput[];
}

/**
 * En-tête teinté d'un Espace : nom, contexte et pastilles des premiers membres. Contour `surface` : une pastille de
 * la même teinte que l'en-tête reste visible.
 */
export function SpaceHeader({ spaceId, name, meta, members }: SpaceHeaderProps) {
  const tint = tintOf(spaceId);
  const shown = members.slice(0, MAX_BADGES);
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3.5 rounded-card px-5.5 py-5",
        tint.background,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight wrap-break-word">{name}</h1>
        <p className="mt-0.5 text-sm text-muted">{meta}</p>
      </div>
      <div
        role="img"
        aria-label={`Membres : ${members.map((member) => member.name).join(", ")}`}
        className="flex"
      >
        {shown.map((member, index) => (
          <span key={member.userId} className={index === 0 ? undefined : "-ml-2.5"}>
            <PersonBadge
              id={member.userId}
              name={member.name}
              ringClassName="border-2 border-surface"
            />
          </span>
        ))}
      </div>
    </header>
  );
}
