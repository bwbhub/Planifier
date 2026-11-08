import type { AgendaEntryOutput } from "@planifier/api-contract";
import { Button, buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";

import { COMMON_LABELS } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

import { AGENDA_LABELS } from "../labels";
import { whenLabel } from "../utils/agenda-items";

interface ImportedEntryProps {
  entry: AgendaEntryOutput;
  onClose: () => void;
}

/** Entrée importée : lisible, jamais modifiable ici (elle change à la source). */
export function ImportedEntry({ entry, onClose }: ImportedEntryProps) {
  const { when, location, description } = entry;
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-muted">Quand</dt>
          <dd>{whenLabel(when)}</dd>
        </div>
        {location === null ? null : (
          <div>
            <dt className="text-muted">Lieu</dt>
            <dd className="wrap-break-word">{location}</dd>
          </div>
        )}
        {description === null ? null : (
          <div>
            <dt className="text-muted">Description</dt>
            <dd className="wrap-break-word whitespace-pre-line">{description}</dd>
          </div>
        )}
      </dl>
      <p className="text-sm text-muted">{AGENDA_LABELS.importedNote}</p>
      <div className="flex flex-wrap gap-2">
        <Link href={ROUTES.agendaImports} className={buttonClassName({ variant: "secondary" })}>
          {AGENDA_LABELS.importsLink}
        </Link>
        <Button variant="ghost" onClick={onClose}>
          {COMMON_LABELS.close}
        </Button>
      </div>
    </div>
  );
}
