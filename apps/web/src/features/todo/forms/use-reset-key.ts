import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Clé qui change quand le formulaire de l'élément posé sur `ref` se vide (saisie à la chaîne). Un `reset` du navigateur
 * ne prévient pas React : un champ qui garde son état (panneau ouvert, heure choisie) la prend pour `key` et repart de
 * sa valeur de départ.
 */
export function useResetKey<TElement extends HTMLElement>(): {
  ref: RefObject<TElement | null>;
  key: number;
} {
  const ref = useRef<TElement>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    const form = ref.current?.closest("form");
    const onReset = () => {
      setKey((count) => count + 1);
    };
    form?.addEventListener("reset", onReset);
    return () => {
      form?.removeEventListener("reset", onReset);
    };
  }, []);
  return { ref, key };
}
