import { Card } from "./card";
import { Skeleton } from "./skeleton";

/** Lignes fantômes pendant un chargement ; le texte caché dit ce qui charge. */
export function ListSkeleton({ label, rows = 2 }: { label: string; rows?: number | undefined }) {
  return (
    <Card role="status" aria-busy="true" className="flex flex-col gap-4.5 px-4.5 py-3.5">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3" aria-hidden="true">
          <Skeleton shape="circle" />
          <Skeleton className="flex-1" />
        </div>
      ))}
    </Card>
  );
}
