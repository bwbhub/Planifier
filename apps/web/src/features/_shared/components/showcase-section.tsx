import { TitledSection } from "@planifier/ui/components/titled-section";
import type { ReactNode } from "react";

/** Une section de la page de référence des composants : titre, puis ses cas l'un sous l'autre. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <TitledSection title={title} className="p-6">
      <div className="flex flex-col gap-4">{children}</div>
    </TitledSection>
  );
}
