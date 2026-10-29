import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/account";
import { SPACE_LABELS, SpacePage, SpaceView } from "@/features/spaces";
import { pageTitle } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

import { spaceIdOf } from "./space-id";

export const metadata: Metadata = { title: pageTitle("Espace") };

export default async function SpaceDetailPage({ params }: PageProps<"/espaces/[spaceId]">) {
  const spaceId = await spaceIdOf(params);
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <SpacePage back={{ href: ROUTES.spaces, label: SPACE_LABELS.backToList }} wide>
      <SpaceView spaceId={spaceId} meId={user.id} />
    </SpacePage>
  );
}
