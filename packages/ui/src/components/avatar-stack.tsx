import { Avatar } from "./avatar";

export interface AvatarStackPerson {
  /** Identifiant stable : il fixe la teinte de la pastille. */
  id: string;
  name: string;
}

export interface AvatarStackProps {
  people: readonly AvatarStackPerson[];
  /** Libellé lu par les lecteurs d'écran, fourni par l'app (« Membres : … ») : le package n'a pas de textes. */
  label: string;
  /** Pastilles montrées au plus ; le libellé nomme tout le monde. */
  max?: number;
}

/**
 * Pastilles qui se chevauchent, nommées d'un seul libellé. Contour `surface` : une pastille de la même teinte que le
 * fond reste visible.
 */
export function AvatarStack({ people, label, max = 5 }: AvatarStackProps) {
  return (
    <div role="img" aria-label={label} className="flex">
      {people.slice(0, max).map((person, index) => (
        <span key={person.id} className={index === 0 ? undefined : "-ml-2.5"}>
          <Avatar id={person.id} name={person.name} ringClassName="border-2 border-surface" />
        </span>
      ))}
    </div>
  );
}
