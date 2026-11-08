"use client";

import type { ImportSubscriptionOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { ConfirmDialog } from "@planifier/ui/components/confirm-dialog";
import { SettingRow } from "@planifier/ui/components/setting-list";
import { useState } from "react";

import { useDeleteImport, useRefreshImport } from "../queries/imports.queries";
import { fetchedLabel } from "../utils/import-age";
import { IMPORT_FAILURE_MESSAGES, importErrorMessage } from "../utils/import-error-message";

/** Une ligne d'agenda importé : nom, hôte, dernière lecture, « Actualiser » et « Retirer » (confirmé). */
export function ImportRow({ item }: { item: ImportSubscriptionOutput }) {
  const refresh = useRefreshImport();
  const remove = useDeleteImport();
  const [confirming, setConfirming] = useState(false);
  const failure = refresh.isError
    ? importErrorMessage(refresh.error)
    : item.lastError === null
      ? null
      : IMPORT_FAILURE_MESSAGES[item.lastError];

  return (
    <SettingRow
      title={item.label}
      hint={
        <>
          <span>
            {item.urlHint} · {fetchedLabel(item.lastFetchedAt)}
          </span>
          {failure === null ? null : (
            <span role="alert" className="mt-0.5 block text-accent-text">
              {failure}
            </span>
          )}
        </>
      }
    >
      <div className="flex flex-wrap justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          loading={refresh.isPending}
          onClick={() => {
            refresh.mutate({ subscriptionId: item.id });
          }}
        >
          Actualiser
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setConfirming(true);
          }}
        >
          Retirer
        </Button>
      </div>
      {confirming ? (
        <ConfirmDialog
          title={`Retirer « ${item.label} » ?`}
          description="L'agenda et toutes les entrées qu'il a importées disparaissent d'ici. Ton agenda d'origine n'est pas touché."
          confirmLabel="Retirer l'agenda"
          pendingLabel="Retrait…"
          cancelLabel="Garder l'agenda"
          pending={remove.isPending}
          error={
            remove.isError ? (
              <p role="alert" className="text-sm text-accent-text">
                {importErrorMessage(remove.error)}
              </p>
            ) : undefined
          }
          onConfirm={() => {
            remove.mutate({ subscriptionId: item.id });
          }}
          onClose={() => {
            setConfirming(false);
          }}
        />
      ) : null}
    </SettingRow>
  );
}
