/** Lignes fantômes pendant un chargement ; le texte caché dit ce qui charge. */
export function ListSkeleton({ label, rows = 2 }: { label: string; rows?: number | undefined }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col gap-4.5 rounded-card bg-surface px-4.5 py-3.5"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3" aria-hidden="true">
          <span className="size-10 animate-pulse rounded-pill bg-field motion-reduce:animate-none" />
          <span className="h-4 flex-1 animate-pulse rounded-control bg-field motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
