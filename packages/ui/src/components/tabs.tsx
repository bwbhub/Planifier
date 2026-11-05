"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef } from "react";

import { cn } from "../lib/cn";

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  /** Compteur écrit après le libellé (tâches ouvertes…). */
  count?: number | undefined;
}

export interface TabsProps<TValue extends string> {
  /** Nom de la liste d'onglets pour les lecteurs d'écran. */
  label: string;
  tabs: readonly TabItem<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  /** Le panneau de l'onglet choisi ; il est relié à l'onglet (`role="tabpanel"`). */
  children: ReactNode;
  className?: string | undefined;
}

/**
 * Onglets qui changent le contenu d'un même écran (modèle ARIA « tabs ») : une seule tabulation sur la liste,
 * flèches, Début et Fin pour passer d'un onglet à l'autre, l'onglet s'ouvre au focus. Pour des pages distinctes
 * (adresses), préférer des liens avec `aria-current`.
 */
export function Tabs<TValue extends string>({
  label,
  tabs,
  value,
  onValueChange,
  children,
  className,
}: TabsProps<TValue>) {
  const id = useId();
  const refs = useRef(new Map<TValue, HTMLButtonElement>());

  function select(next: TabItem<TValue> | undefined) {
    if (next === undefined) return;
    onValueChange(next.value);
    refs.current.get(next.value)?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const target: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const to = target[event.key];
    if (to === undefined) return;
    event.preventDefault();
    select(tabs[to]);
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((tab, index) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              ref={(node) => {
                if (node === null) refs.current.delete(tab.value);
                else refs.current.set(tab.value, node);
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                onValueChange(tab.value);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index);
              }}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-control font-semibold",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                selected ? "bg-ink text-surface" : "bg-field text-ink hover:bg-line",
              )}
            >
              {tab.label}
              {/* Espace lu par les lecteurs d'écran (« Courses 3 »), sans effet à l'écran (flex + gap). */}{" "}
              {tab.count === undefined || tab.count === 0 ? null : (
                <span className="text-sm opacity-80">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${value}`}
        tabIndex={0}
        className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {children}
      </div>
    </div>
  );
}
