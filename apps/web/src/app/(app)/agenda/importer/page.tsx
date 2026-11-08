import type { Metadata } from "next";

import { ImportsView } from "@/features/agenda";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Agendas importés") };

// Accès réservé aux comptes connectés : garde du layout `(app)`.
export default function AgendaImportsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-4 pb-24 sm:pb-10">
      <ImportsView />
    </main>
  );
}
