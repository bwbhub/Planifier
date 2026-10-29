import type { Metadata } from "next";

import { SPACE_LABELS, SpacePage, SpacesList } from "@/features/spaces";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle(SPACE_LABELS.myList) };

export default function SpacesPage() {
  return (
    <SpacePage
      title={SPACE_LABELS.myList}
      intro="Ce que tu partages avec d'autres. Ce qui n'est dans aucun Espace reste privé."
    >
      <SpacesList />
    </SpacePage>
  );
}
