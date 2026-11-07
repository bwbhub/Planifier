import { cn } from "../lib/cn";

const SHAPES = {
  /** Ligne de texte ou de tâche. */
  line: "h-4 w-full rounded-control",
  /** Pastille ou case. */
  circle: "size-10 rounded-pill",
  /** Bloc de créneau ou de contenu. */
  block: "h-16 w-full rounded-control",
  /** Carte entière. */
  card: "h-32 w-full rounded-card",
} as const;

export type SkeletonShape = keyof typeof SHAPES;

export interface SkeletonProps {
  shape?: SkeletonShape;
  className?: string;
}

/**
 * Forme fantôme pendant un chargement. Décorative (`aria-hidden`) : le parent annonce ce qui charge, une fois
 * (`role="status"` + texte caché, voir `ListSkeleton`). Ne bouge pas si l'utilisateur a demandé moins d'animation.
 */
export function Skeleton({ shape = "line", className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block shrink-0 animate-pulse bg-field motion-reduce:animate-none",
        SHAPES[shape],
        className,
      )}
    />
  );
}
