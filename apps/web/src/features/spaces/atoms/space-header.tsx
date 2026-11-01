import type { SpaceMemberOutput } from "@planifier/api-contract";
import { cn } from "@planifier/ui/lib/cn";

import { tintOf } from "@planifier/ui/lib/tint";
import { AvatarStack } from "@planifier/ui/components/avatar-stack";

interface SpaceHeaderProps {
  spaceId: string;
  name: string;
  /** Ligne de contexte : nombre de personnes, modules. */
  meta: string;
  members: readonly SpaceMemberOutput[];
}

/**
 * En-tête teinté d'un Espace : nom, contexte et pastilles des premiers membres.
 */
export function SpaceHeader({ spaceId, name, meta, members }: SpaceHeaderProps) {
  const tint = tintOf(spaceId);
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
      <AvatarStack
        people={members.map(({ userId, name }) => ({ id: userId, name }))}
        label={`Membres : ${members.map((member) => member.name).join(", ")}`}
      />
    </header>
  );
}
