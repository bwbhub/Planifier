import type { Metadata } from "next";

import { AgendaView, parseAgendaParams } from "@/features/agenda";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Agenda") };

interface AgendaPageProps {
  searchParams: Promise<{
    vue?: string | string[];
    jour?: string | string[];
    espace?: string | string[];
  }>;
}

// Accès réservé aux comptes connectés : garde du layout `(app)`.
export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = parseAgendaParams(await searchParams);
  // `key` : les choix faits dans un Espace (personnes masquées) ne valent pas pour le suivant.
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 px-4 pt-4 pb-24 sm:pb-10">
      <AgendaView key={params.spaceId ?? "mine"} {...params} />
    </main>
  );
}
