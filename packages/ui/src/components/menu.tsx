"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/cn";
import { buttonClassName } from "./button";

export interface MenuItemSpec {
  /** Clé stable de l'action. */
  key: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface MenuProps {
  /** Nom du menu pour les lecteurs d'écran, avec son objet : « Actions de « Acheter du pain » ». */
  label: string;
  /** Contenu visible du bouton (texte ou pictogramme décoratif). */
  trigger: ReactNode;
  items: readonly MenuItemSpec[];
  /** Côté du bouton sur lequel le menu s'aligne. */
  align?: "start" | "end";
}

const GAP_PX = 4;
const MARGIN_PX = 8;

/**
 * Pose le menu sous son bouton (au-dessus s'il manque la place en bas et qu'elle existe en haut), aligné sur un bord et
 * gardé dans l'écran. Il est `fixed` dans la couche supérieure : les coordonnées sont celles de la fenêtre.
 */
function place(menu: HTMLElement, trigger: HTMLElement, align: "start" | "end") {
  const anchor = trigger.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = menu;
  const left = align === "end" ? anchor.right - width : anchor.left;
  const maxLeft = window.innerWidth - width - MARGIN_PX;
  const fitsBelow = anchor.bottom + GAP_PX + height <= window.innerHeight - MARGIN_PX;
  const fitsAbove = anchor.top - GAP_PX - height >= MARGIN_PX;
  const top = fitsBelow || !fitsAbove ? anchor.bottom + GAP_PX : anchor.top - GAP_PX - height;
  menu.style.top = `${String(top)}px`;
  menu.style.left = `${String(Math.max(MARGIN_PX, Math.min(left, maxLeft)))}px`;
}

function enabledItems(menu: HTMLElement | null): HTMLElement[] {
  return menu === null
    ? []
    : [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')];
}

/** Flèches, Début et Fin : le focus circule entre les actions (roving focus), sans quitter le menu. */
function moveFocus(event: KeyboardEvent, menu: HTMLElement | null) {
  const all = enabledItems(menu);
  if (all.length === 0) return;
  const current = all.findIndex((item) => item === document.activeElement);
  const targets: Record<string, number> = {
    ArrowDown: (current + 1) % all.length,
    ArrowUp: (current - 1 + all.length) % all.length,
    Home: 0,
    End: all.length - 1,
  };
  const next = targets[event.key];
  if (next === undefined) return;
  event.preventDefault();
  all[next]?.focus();
}

interface MenuItemsProps {
  specs: readonly MenuItemSpec[];
  /** Après l'action : le menu se referme et le focus revient au bouton. */
  onChosen: () => void;
}

function MenuItems({ specs, onChosen }: MenuItemsProps) {
  return (
    <>
      {specs.map(({ key, label, onSelect, disabled }) => (
        <button
          key={key}
          type="button"
          role="menuitem"
          disabled={disabled === true}
          tabIndex={-1}
          className={cn(
            "flex min-h-11 w-full items-center rounded-control px-3 text-left font-semibold",
            // Le focus clavier se voit autrement que le survol : un anneau d'accent (WCAG 2.4.7, 1.4.11).
            "enabled:hover:bg-field focus-visible:bg-field focus-visible:ring-2 focus-visible:ring-accent",
            "disabled:opacity-60",
          )}
          onClick={() => {
            onSelect();
            onChosen();
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}

/** Où le focus arrive à l'ouverture ; `null` : menu fermé. */
type Opening = "first" | "last" | null;

interface OpenMenu {
  opening: Opening;
  align: "start" | "end";
  menu: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLButtonElement | null>;
  /** Stable (le `set` d'un `useState`) : l'effet ne doit pas repartir à chaque rendu et refocaliser. */
  setOpening: (opening: Opening) => void;
}

/**
 * Tant que le menu est ouvert : couche supérieure, placement, focus sur la première (ou dernière) action, fermeture sur
 * un appui ailleurs, un défilement ou un redimensionnement (le menu ne suit pas son bouton). Avant la peinture (effet de
 * mise en page) : il n'apparaît jamais mal placé. `popover` est posé ici et non dans le JSX : sans API Popover (jsdom),
 * le menu reste un élément ordinaire, visible et testable.
 */
function useOpenMenu({ opening, align, menu, trigger, setOpening }: OpenMenu) {
  useLayoutEffect(() => {
    const element = menu.current;
    const button = trigger.current;
    if (opening === null || element === null || button === null) return;
    const popover = "showPopover" in element;
    if (popover) {
      element.setAttribute("popover", "manual");
      element.showPopover();
      place(element, button, align);
    }
    const all = enabledItems(element);
    (opening === "last" ? all[all.length - 1] : all[0])?.focus({ preventScroll: true });
    const close = () => {
      setOpening(null);
    };
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !element.contains(target) && !button.contains(target)) close();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      if (popover && element.matches(":popover-open")) element.hidePopover();
    };
  }, [opening, align, menu, trigger, setOpening]);
}

/**
 * Menu d'actions : un bouton qui ouvre une liste (`aria-haspopup="menu"`). Clavier : Entrée, Espace ou flèche bas
 * ouvrent sur la première action, flèche haut sur la dernière ; flèches, Début et Fin circulent ; Échap ferme et rend
 * le focus au bouton ; Tab ferme et laisse le focus suivre son cours depuis le bouton. Un appui ailleurs ferme. Affiché
 * dans la couche supérieure du navigateur (API Popover) : aucun parent, même rognant, ne le coupe. Sans métier : les
 * actions et les mots viennent de l'appelant.
 */
export function Menu({ label, trigger, items: specs, align = "end" }: MenuProps) {
  const [opening, setOpening] = useState<Opening>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = opening !== null;

  useOpenMenu({ opening, align, menu: menuRef, trigger: triggerRef, setOpening });

  function close() {
    setOpening(null);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setOpening(event.key === "ArrowUp" ? "last" : "first");
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") event.preventDefault();
    // Tab : le focus revient au bouton avant que le navigateur le déplace, il repart donc de là (jamais sur `body`).
    if (event.key === "Escape" || event.key === "Tab") close();
    else moveFocus(event, menuRef.current);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={buttonClassName({ variant: "ghost", size: "sm" })}
        onClick={() => {
          setOpening(open ? null : "first");
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="m-0 flex min-w-48 flex-col rounded-control border border-line bg-surface p-1.5 text-ink"
        >
          <MenuItems specs={specs} onChosen={close} />
        </div>
      ) : null}
    </>
  );
}
