import type { Metadata } from "next";

import { PageHeader } from "@planifier/ui/components/page-header";
import { UiShowcase } from "@/features/_shared/components/ui-showcase";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Composants") };

/** Page de référence des composants de `packages/ui` et de leurs états (derrière la connexion, comme le reste). */
export default function ComponentsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-4 pb-10">
      <PageHeader title="Composants" />
      <UiShowcase />
    </main>
  );
}
