import { Button } from "@planifier/ui/components/button";
import { EmptyState } from "@planifier/ui/components/empty-state";
import { ListSkeleton } from "@planifier/ui/components/list-skeleton";
import { LoadError } from "@planifier/ui/components/load-error";
import { Skeleton } from "@planifier/ui/components/skeleton";

/** Les trois états de chaque écran de données : chargement, vide, erreur (sans interaction réelle). */
export function StatesDemo() {
  return (
    <>
      <ListSkeleton label="Chargement de tes listes…" rows={3} />
      <div className="flex flex-col gap-2">
        <Skeleton shape="line" />
        <Skeleton shape="block" />
        <Skeleton shape="card" />
      </div>
      <EmptyState
        title="Aucune liste pour l'instant"
        description="Une liste réunit des tâches : courses, maison, vacances…"
        action={<Button>Créer ma première liste</Button>}
      />
      <LoadError
        message="Tes listes n'ont pas pu être chargées. Rien n'est perdu."
        retryLabel="Réessayer"
        onRetry={() => undefined}
      />
    </>
  );
}
