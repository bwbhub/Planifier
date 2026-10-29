import type { Metadata } from "next";

import { SPACE_LABELS, SpaceForm, SpacePage } from "@/features/spaces";
import { pageTitle } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: pageTitle(SPACE_LABELS.newSpace) };

export default function NewSpacePage() {
  return (
    <SpacePage
      back={{ href: ROUTES.spaces, label: SPACE_LABELS.backToList }}
      title={SPACE_LABELS.newSpace}
    >
      <SpaceForm />
    </SpacePage>
  );
}
