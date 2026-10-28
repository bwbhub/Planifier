"use client";

import { Button, buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";

import { COMMON_LABELS } from "@/lib/labels";
import { ROUTES, spaceRoute } from "@/lib/routes";

import { ListSkeleton } from "../atoms/list-skeleton";
import { LoadError } from "../atoms/load-error";
import { MessageCard } from "../atoms/message-card";
import { PersonBadge } from "../atoms/person-badge";
import { RolePill } from "../atoms/role-pill";
import { peopleCount, SPACE_LABELS } from "../labels";
import { useSpaces } from "../queries/spaces.queries";

const createLink = (
  <Link href={ROUTES.newSpace} className={buttonClassName({ className: "w-full" })}>
    {SPACE_LABELS.create}
  </Link>
);

function NoSpaces() {
  return (
    <MessageCard title="Partager, si tu veux">
      <p className="text-muted">
        Un Espace réunit des personnes : un couple, une colocation, des vacances. Tout ce que tu
        crées sans Espace reste privé.
      </p>
      {createLink}
      <p className="text-sm text-muted">
        On t&apos;a envoyé un lien ? Ouvre-le simplement pour rejoindre l&apos;Espace.
      </p>
    </MessageCard>
  );
}

/** Mes Espaces : nom, nombre de personnes, mon rôle ; création en bas de liste. */
export function SpacesList() {
  const spaces = useSpaces();

  if (spaces.isPending) return <ListSkeleton label="Chargement de tes Espaces…" />;
  if (spaces.isError) {
    return (
      <LoadError
        message="Tes Espaces n'ont pas pu être chargés. Rien n'est perdu."
        onRetry={() => void spaces.refetch()}
      />
    );
  }

  const items = spaces.data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <NoSpaces />;

  return (
    <>
      <ul aria-label={SPACE_LABELS.myList} className="rounded-card bg-surface px-4.5 py-1.5">
        {items.map((space) => (
          <li key={space.id} className="border-b border-line last:border-b-0">
            <Link
              href={spaceRoute(space.id)}
              className="flex min-h-15 items-center gap-3 py-2 text-ink"
            >
              <PersonBadge id={space.id} name={space.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium wrap-break-word">{space.name}</span>
                <span className="mt-0.5 block text-sm text-muted">
                  {peopleCount(space.memberCount)}
                </span>
              </span>
              {space.myRole === "OWNER" ? <RolePill role="OWNER" /> : null}
              <span aria-hidden="true" className="text-muted">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {spaces.hasNextPage ? (
        <Button
          variant="secondary"
          disabled={spaces.isFetchingNextPage}
          onClick={() => void spaces.fetchNextPage()}
        >
          {spaces.isFetchingNextPage ? COMMON_LABELS.loading : COMMON_LABELS.showMore}
        </Button>
      ) : null}
      {createLink}
    </>
  );
}
