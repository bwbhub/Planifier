import type { Metadata } from "next";

import { SPACE_LABELS, SpacePage, SpaceSettings } from "@/features/spaces";
import { pageTitle } from "@/lib/labels";
import { spaceRoute } from "@/lib/routes";

import { spaceIdOf } from "../space-id";

export const metadata: Metadata = { title: pageTitle(SPACE_LABELS.settings) };

export default async function SpaceSettingsPage({
  params,
}: PageProps<"/espaces/[spaceId]/reglages">) {
  const spaceId = await spaceIdOf(params);
  return (
    <SpacePage
      back={{ href: spaceRoute(spaceId), label: SPACE_LABELS.backToSpace }}
      title={SPACE_LABELS.settings}
    >
      <SpaceSettings spaceId={spaceId} />
    </SpacePage>
  );
}
