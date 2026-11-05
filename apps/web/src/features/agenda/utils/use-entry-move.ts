import { type GridPoint, shiftedWhen } from "@planifier/domain-agenda/move";
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { useUpdateEntry } from "../queries/agenda.queries";
import type { AgendaItem } from "./agenda-items";
import { pointAt } from "./move-zones";

/** Sur un écran tactile, appui qui décolle une entrée (environ une seconde). */
export const HOLD_MS = 900;
/** Au-delà, en pixels, la souris tire l'entrée ; le doigt, lui, fait défiler et renonce. */
const DRAG_THRESHOLD = 8;
/** Le clic qui suit un glisser ou un appui long arrive dans ce délai ; passé, plus rien n'est avalé. */
const CLICK_AFTER_GESTURE_MS = 600;

/** `dragging` : tirée à la souris ; `lifted` : décollée au doigt, elle attend qu'on touche un créneau. */
export type MoveState =
  | { kind: "idle" }
  | { kind: "dragging"; item: AgendaItem; from: GridPoint; to: GridPoint | null }
  | { kind: "lifted"; item: AgendaItem; from: GridPoint };

/** Ce qu'une entrée montre de son déplacement ; `saving` : posée, en cours d'envoi. */
export type MovingKind = Exclude<MoveState["kind"], "idle"> | "saving";

interface Press {
  item: AgendaItem;
  /** Là où l'entrée a été prise : le décalage se compte depuis ce point. */
  from: GridPoint;
  x: number;
  y: number;
  /** Doigt : minuteur de l'appui long ; souris : `null`. */
  timer: number | null;
  dragging: boolean;
}

interface PressHandlers {
  onDrag: (press: Press, to: GridPoint | null) => void;
  onDrop: (press: Press, to: GridPoint | null) => void;
  /** Le glisser s'arrête sans rien poser : bouton relâché hors de la fenêtre, fenêtre quittée. */
  onDragAbort: () => void;
  /** Échap : tout s'arrête, entrée décollée comprise. */
  onEscape: () => void;
}

function stopPress(press: RefObject<Press | null>) {
  if (press.current?.timer != null) window.clearTimeout(press.current.timer);
  press.current = null;
}

/** Après le seuil : la souris tire, le doigt renonce (il fait défiler). `true` : l'entrée est tirée. */
function followPointer(press: RefObject<Press | null>, event: PointerEvent): boolean {
  const current = press.current;
  if (current === null) return false;
  const far = Math.hypot(event.clientX - current.x, event.clientY - current.y) > DRAG_THRESHOLD;
  if (current.timer !== null) {
    if (far) stopPress(press);
    return false;
  }
  current.dragging ||= far;
  return current.dragging;
}

/** Suit l'appui en cours sur toute la page : un glisser sort vite de l'entrée tirée. */
function usePressListeners(press: RefObject<Press | null>, handlers: PressHandlers) {
  const onDrag = useEffectEvent(handlers.onDrag);
  const onDrop = useEffectEvent(handlers.onDrop);
  const onDragAbort = useEffectEvent(handlers.onDragAbort);
  const onEscape = useEffectEvent(handlers.onEscape);
  useEffect(() => {
    const abort = () => {
      stopPress(press);
      onDragAbort();
    };
    function onMove(event: PointerEvent) {
      // Bouton relâché hors de la fenêtre : le `pointerup` n'est jamais venu.
      if (event.pointerType === "mouse" && event.buttons === 0 && press.current?.dragging) abort();
      else if (followPointer(press, event) && press.current !== null) {
        onDrag(press.current, pointAt(event.clientX, event.clientY));
      }
    }
    function onUp(event: PointerEvent) {
      const current = press.current;
      stopPress(press);
      if (current?.dragging === true) onDrop(current, pointAt(event.clientX, event.clientY));
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      stopPress(press);
      onEscape();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("blur", abort);
    window.addEventListener("keydown", onKey);
    return () => {
      stopPress(press);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("blur", abort);
      window.removeEventListener("keydown", onKey);
    };
  }, [press]);
}

/** Avale le clic qui suit un glisser ou un appui long, et lui seul (un clic clavier plus tard ouvre l'entrée). */
function useClickAfterGesture() {
  const until = useRef(0);
  return {
    mark: () => {
      until.current = Date.now() + CLICK_AFTER_GESTURE_MS;
    },
    clear: () => {
      until.current = 0;
    },
    consume: () => {
      const swallowed = Date.now() < until.current;
      until.current = 0;
      return swallowed;
    },
  };
}

/**
 * Déplacer ses entrées dans la grille. Souris : on tire et on lâche sur un créneau. Doigt : un appui long décolle
 * l'entrée, qui reste « volante » jusqu'à ce qu'on touche un créneau (on peut changer de jour entre-temps). Le
 * formulaire reste la voie du clavier. Rien ne part sans geste : l'envoi suit le dépôt, avec la version lue.
 */
export function useEntryMove() {
  const { mutate, reset, error, isPending, variables } = useUpdateEntry();
  const [state, setState] = useState<MoveState>({ kind: "idle" });
  const press = useRef<Press | null>(null);
  const click = useClickAfterGesture();

  function place(item: AgendaItem, from: GridPoint, to: GridPoint | null) {
    setState({ kind: "idle" });
    const { entry } = item;
    if (entry === null || to === null) return;
    const when = shiftedWhen(entry.when, from, to);
    if (when !== null) mutate({ entryId: entry.id, version: entry.version, when });
  }

  usePressListeners(press, {
    onDrag: ({ item, from }, to) => {
      setState({ kind: "dragging", item, from, to });
    },
    onDrop: ({ item, from }, to) => {
      click.mark();
      place(item, from, to);
    },
    onDragAbort: () => {
      setState((shown) => (shown.kind === "dragging" ? { kind: "idle" } : shown));
    },
    onEscape: () => {
      setState({ kind: "idle" });
    },
  });

  /** Appui sur une de mes entrées : souris, peut-être un glisser ; doigt, peut-être un appui long. */
  function onPress(item: AgendaItem, event: ReactPointerEvent) {
    // Un envoi à la fois : le suivant partirait avec une version déjà dépassée.
    if (item.entry === null || state.kind === "lifted" || isPending) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const from = pointAt(event.clientX, event.clientY);
    if (from === null) return;
    click.clear();
    reset();
    const lift = () => {
      press.current = null;
      click.mark();
      setState({ kind: "lifted", item, from });
    };
    const touch = event.pointerType !== "mouse";
    const timer = touch ? window.setTimeout(lift, HOLD_MS) : null;
    press.current = { item, from, x: event.clientX, y: event.clientY, timer, dragging: false };
  }

  /**
   * Un clic dans la grille. Celui qui suit un geste est avalé. Entrée décollée : un créneau la pose ; elle-même, ça
   * l'annule ; ailleurs (un jour de l'en-tête), il passe, et elle reste décollée. `true` : le clic est pris.
   */
  function claimClick(x: number, y: number, target: EventTarget): boolean {
    if (click.consume()) return true;
    if (state.kind !== "lifted") return false;
    const onItself =
      target instanceof Element && target.closest(`[data-entry-id="${state.item.id}"]`) !== null;
    const to = onItself ? state.from : pointAt(x, y);
    if (to === null) return false;
    place(state.item, state.from, to);
    return true;
  }

  function movingOf(id: string): MovingKind | null {
    if (isPending && variables.entryId === id) return "saving";
    return state.kind !== "idle" && state.item.id === id ? state.kind : null;
  }

  return {
    state,
    error,
    onPress,
    claimClick,
    movingOf,
    cancel: () => {
      setState({ kind: "idle" });
    },
  };
}

export type EntryMove = ReturnType<typeof useEntryMove>;
