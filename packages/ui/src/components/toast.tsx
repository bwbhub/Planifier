"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "./button";

/** Durée d'affichage : une erreur reste plus longtemps, le temps de la lire. */
const DURATION_MS = { confirmation: 5000, error: 8000 } as const;

export type ToastTone = keyof typeof DURATION_MS;

export interface ToastAction {
  /** Ce que fait l'action, nommé : « Annuler ». */
  label: string;
  onAction: () => void;
}

export interface ToastOptions {
  /** `error` : refus ou échec, annoncé tout de suite ; `confirmation` (défaut) : résultat d'un geste réussi. */
  tone?: ToastTone;
  /** Geste proposé tant que le message est là (annuler une action réversible). */
  action?: ToastAction;
}

interface ToastMessage extends ToastOptions {
  id: number;
  text: string;
}

interface ToastApi {
  /** Affiche un message à la place du précédent (un seul à la fois). */
  notify: (text: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Accès aux toasts. Hors `ToastProvider` : erreur franche, pas un message qui se perd. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) throw new Error("useToast doit être utilisé sous un ToastProvider.");
  return api;
}

interface ToastViewProps {
  message: ToastMessage;
  dismissLabel: string;
  onDismiss: () => void;
}

/**
 * Message affiché. Le minuteur s'arrête tant que la souris ou le focus est dessus et repart à zéro ensuite : on a le
 * temps de lire et d'atteindre l'action.
 */
function ToastView({ message, dismissLabel, onDismiss }: ToastViewProps) {
  const [paused, setPaused] = useState(false);
  const { tone = "confirmation", action, text } = message;

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, DURATION_MS[tone]);
    return () => {
      clearTimeout(timer);
    };
  }, [paused, tone, onDismiss]);

  return (
    <div
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-card bg-ink py-2 pr-2 pl-4 text-sm text-surface"
    >
      <p className="min-w-0 flex-1 wrap-break-word">{text}</p>
      {action === undefined ? null : (
        <Button
          variant="ghost"
          size="sm"
          className="text-surface"
          onClick={() => {
            action.onAction();
            onDismiss();
          }}
        >
          {action.label}
        </Button>
      )}
      <Button variant="ghost" size="sm" className="text-surface" onClick={onDismiss}>
        {dismissLabel}
      </Button>
    </div>
  );
}

export interface ToastProviderProps {
  /** Libellé du bouton qui ferme le message (texte donné par l'app : `ui` n'écrit aucun mot). */
  dismissLabel: string;
  children: ReactNode;
}

/**
 * Fournit `useToast` et affiche les messages en bas de l'écran, au-dessus de la barre de navigation mobile
 * (`--nav-height`). Les deux zones d'annonce existent en permanence : un lecteur d'écran n'annonce que ce qui change
 * dans une zone déjà présente.
 */
export function ToastProvider({ dismissLabel, children }: ToastProviderProps) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const notify = useCallback((text: string, options: ToastOptions = {}) => {
    setMessage((previous) => ({ ...options, text, id: (previous?.id ?? 0) + 1 }));
  }, []);
  const dismiss = useCallback(() => {
    setMessage(null);
  }, []);
  const api = useMemo(() => ({ notify }), [notify]);
  const isError = message?.tone === "error";

  return (
    <ToastContext value={api}>
      {children}
      <div
        className={
          "pointer-events-none fixed inset-x-4 bottom-[calc(var(--nav-height,0px)+1rem)] z-40 flex flex-col gap-2"
        }
      >
        <div role="status">
          {message === null || isError ? null : (
            <ToastView
              key={message.id}
              message={message}
              dismissLabel={dismissLabel}
              onDismiss={dismiss}
            />
          )}
        </div>
        <div role="alert">
          {message !== null && isError ? (
            <ToastView
              key={message.id}
              message={message}
              dismissLabel={dismissLabel}
              onDismiss={dismiss}
            />
          ) : null}
        </div>
      </div>
    </ToastContext>
  );
}
