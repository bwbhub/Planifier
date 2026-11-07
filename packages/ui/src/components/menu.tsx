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

/** Pose le menu sous son bouton, aligné sur un bord et gardé dans l'écran (le menu est en couche supérieure, `fixed`). */
function place(menu: HTMLElement, trigger: HTMLElement, align: "start" | "end") {
  const anchor = trigger.getBoundingClientRect();
  const width = menu.offsetWidth;
  const left = align === "end" ? anchor.right - width : anchor.left;
  const maxLeft = window.innerWidth - width - MARGIN_PX;
  menu.style.top = `${String(anchor.bottom + GAP_PX)}px`;
  menu.style.left = `${String(Math.max(MARGIN_PX, Math.min(left, maxLeft)))}px`;
}

function items(menu: HTMLElement | null): HTMLElement[] {
  return menu === null
    ? []
    : [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')];
}

/** Flèches, Début et Fin : le focus circule entre les actions (roving focus), sans quitter le menu. */
function moveFocus(event: KeyboardEvent, menu: HTMLElement | null) {
  const all = items(menu);
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
      {specs.map(({ key, label: itemLabel, onSelect, disabled }) => (
        <button
          key={key}
          type="button"
          role="menuitem"
          disabled={disabled === true}
          tabIndex={-1}
          className={cn(
            "flex min-h-11 w-full items-center rounded-control px-3 text-left font-semibold",
            "enabled:hover:bg-field focus-visible:bg-field disabled:opacity-60",
          )}
          onClick={() => {
            onSelect();
            onChosen();
          }}
        >
          {itemLabel}
        </button>
      ))}
    </>
  );
}

/**
 * Menu d'actions : un bouton qui ouvre une liste (`aria-haspopup="menu"`). Clavier : Entrée, Espace ou flèche bas
 * ouvrent sur la première action, flèche haut sur la dernière ; flèches, Début et Fin circulent ; Échap ferme et rend
 * le focus au bouton ; Tab ferme. Un clic dehors ferme. Affiché dans la couche supérieure du navigateur (API Popover) :
 * aucun parent, même rognant, ne le coupe. Sans métier : les actions et les mots viennent de l'appelant.
 */
interface OpenMenu {
  open: boolean;
  focusLast: boolean;
  align: "start" | "end";
  menu: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLButtonElement | null>;
  /** Stable (le `set` d'un `useState`) : l'effet ne doit pas repartir à chaque rendu et refocaliser. */
  setOpen: (open: boolean) => void;
}

/**
 * Tant que le menu est ouvert : couche supérieure, placement, focus sur la première (ou dernière) action, fermeture sur
 * un appui ailleurs. Avant la peinture (effet de mise en page) : le menu n'apparaît jamais mal placé. Sans l'API
 * Popover (jsdom), il reste dans le flux, ce qui suffit à le tester.
 */
function useOpenMenu({ open, focusLast, align, menu, trigger, setOpen }: OpenMenu) {
  useLayoutEffect(() => {
    const element = menu.current;
    const button = trigger.current;
    if (!open || element === null || button === null) return;
    const popover = "showPopover" in element;
    if (popover) {
      element.setAttribute("popover", "manual");
      element.showPopover();
      place(element, button, align);
    }
    const all = items(element);
    (focusLast ? all[all.length - 1] : all[0])?.focus();
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!element.contains(target) && !button.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      if (popover && element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, focusLast, align, menu, trigger, setOpen]);
}

export function Menu({ label, trigger, items: specs, align = "end" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [focusLast, setFocusLast] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useOpenMenu({
    open,
    focusLast,
    align,
    menu: menuRef,
    trigger: triggerRef,
    setOpen,
  });

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setFocusLast(event.key === "ArrowUp");
    setOpen(true);
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    } else {
      moveFocus(event, menuRef.current);
    }
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
          setFocusLast(false);
          setOpen((previous) => !previous);
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
          <MenuItems
            specs={specs}
            onChosen={() => {
              close(true);
            }}
          />
        </div>
      ) : null}
    </>
  );
}
