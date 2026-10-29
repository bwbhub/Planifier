"use client";

import { COMMON_LABELS } from "@/lib/labels";

import { useApiHealth } from "../queries/health.queries";

function ApiStatusMessage() {
  const { isPending, isError, refetch } = useApiHealth();
  if (isPending) return <>Connexion à l'API…</>;
  if (isError) {
    return (
      <>
        API injoignable.{" "}
        <button type="button" className="underline" onClick={() => void refetch()}>
          {COMMON_LABELS.retry}
        </button>
      </>
    );
  }
  return <>API joignable.</>;
}

/** Indique si l'API répond. L'état est porté par le texte, pas par une couleur. */
export function ApiStatus() {
  return (
    <p role="status" className="mt-4 text-sm text-muted">
      <ApiStatusMessage />
    </p>
  );
}
