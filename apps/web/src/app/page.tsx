import { cn } from "@planifier/ui/lib/cn";

import { ApiStatus } from "@/features/_shared/components/api-status";

export default function HomePage() {
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-6")}>
      <section className="rounded-card bg-surface px-8 py-10 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">Planifier</h1>
        <p className="mt-2 text-muted">Nouveau socle en cours de construction.</p>
        <ApiStatus />
      </section>
    </main>
  );
}
