"use client";

import { AGENDA_MAX_IMPORTS } from "@planifier/constants/agenda";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { SettingCard } from "@planifier/ui/components/setting-list";
import Link from "next/link";

import { COMMON_LABELS } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

import { ImportForm } from "../forms/import-form";
import { AGENDA_LABELS } from "../labels";
import { useImports } from "../queries/imports.queries";
import { ImportRow } from "./import-row";

function LinkHelp() {
  return (
    <details className="rounded-card bg-surface px-4.5 py-3 text-sm">
      <summary className="min-h-11 cursor-pointer py-2.5 font-semibold">
        Où trouver le lien privé ?
      </summary>
      <ul className="mt-1 flex flex-col gap-2 text-muted">
        <li>
          <strong className="text-ink">Google Agenda</strong> : Paramètres, ton agenda, Intégrer
          l&apos;agenda, « Adresse secrète au format iCal ».
        </li>
        <li>
          <strong className="text-ink">Outlook</strong> : Paramètres, Calendrier, Calendriers
          partagés, publier un calendrier, lien ICS.
        </li>
        <li>
          <strong className="text-ink">iCloud</strong> : partage du calendrier, calendrier public,
          copier le lien.
        </li>
      </ul>
    </details>
  );
}

function ImportsList() {
  const { data, error, isPending, refetch } = useImports();
  if (isPending) {
    return <ListSkeleton label={AGENDA_LABELS.importsLoading} rows={2} />;
  }
  if (error !== null) {
    return (
      <LoadError
        message={`${AGENDA_LABELS.importsLoadFailed} ${COMMON_LABELS.nothingLost}`}
        retryLabel={COMMON_LABELS.retry}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (data.items.length === 0) {
    return (
      <EmptyState
        level={2}
        title={AGENDA_LABELS.importsEmptyTitle}
        description={AGENDA_LABELS.importsEmptyHint}
      />
    );
  }
  return (
    <>
      <SettingCard label={AGENDA_LABELS.importsTitle}>
        {data.items.map((item) => (
          <ImportRow key={item.id} item={item} />
        ))}
      </SettingCard>
      {data.items.length >= AGENDA_MAX_IMPORTS ? (
        <p className="text-sm text-muted">{AGENDA_LABELS.importsFull}</p>
      ) : null}
    </>
  );
}

/** Écran « Agendas importés » : coller un lien privé, voir et actualiser ses agendas, les retirer. */
export function ImportsView() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.agenda}
        className="min-h-11 self-start py-2.5 text-sm text-muted underline"
      >
        {AGENDA_LABELS.importsBack}
      </Link>
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {AGENDA_LABELS.importsTitle}
        </h1>
        <p className="text-muted">{AGENDA_LABELS.importsIntro}</p>
      </header>
      <ImportsList />
      <ImportForm />
      <LinkHelp />
    </div>
  );
}
