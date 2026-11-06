import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { ToastProvider, useToast, type ToastOptions } from "./toast";

function Trigger({ text, options }: { text: string; options?: ToastOptions }) {
  const { notify } = useToast();
  return (
    <button
      onClick={() => {
        notify(text, options);
      }}
    >
      {text}
    </button>
  );
}

function renderToast(ui: ReactNode) {
  return render(<ToastProvider dismissLabel="Fermer">{ui}</ToastProvider>);
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("annonce une confirmation dans la zone de statut", async () => {
    renderToast(<Trigger text="Tâche ajoutée" />);
    await userEvent.click(screen.getByRole("button", { name: "Tâche ajoutée" }));
    expect(screen.getByRole("status").textContent).toContain("Tâche ajoutée");
  });

  it("annonce une erreur dans la zone d'alerte", async () => {
    renderToast(<Trigger text="Rien n'a été envoyé" options={{ tone: "error" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Rien n'a été envoyé" }));
    expect(screen.getByRole("alert").textContent).toContain("Rien n'a été envoyé");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("disparaît seul au bout de quelques secondes", async () => {
    renderToast(<Trigger text="Fait" />);
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("status").textContent).toBe("");
  });
});

describe("Toast : durées", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("une erreur reste 8 s, plus longtemps qu'une confirmation, et se ferme au bouton", async () => {
    renderToast(<Trigger text="Échec" options={{ tone: "error" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Échec" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("alert").textContent).toContain("Échec");
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("un message avec action reste assez pour l'atteindre", async () => {
    renderToast(
      <Trigger text="Fait" options={{ action: { label: "Annuler", onAction: () => undefined } }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(screen.getByRole("status").textContent).toContain("Fait");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("reste en pause tant que le focus est dans le message", async () => {
    renderToast(
      <Trigger text="Fait" options={{ action: { label: "Annuler", onAction: () => undefined } }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    act(() => {
      screen.getByRole("button", { name: "Annuler" }).focus();
    });
    const status = screen.getByRole("status");
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(status.textContent).toContain("Fait");
  });

  it("reste tant que la souris est dessus, puis repart", async () => {
    renderToast(<Trigger text="Fait" />);
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    const status = screen.getByRole("status");
    const message = status.firstElementChild;
    if (message === null) throw new Error("toast absent");
    await userEvent.hover(message);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(status.textContent).toContain("Fait");
    await userEvent.unhover(message);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(status.textContent).toBe("");
  });
});

describe("Toast : messages et actions", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("un nouveau message remplace le précédent", async () => {
    renderToast(
      <>
        <Trigger text="Premier" />
        <Trigger text="Second" />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Premier" }));
    await userEvent.click(screen.getByRole("button", { name: "Second" }));
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Second");
    expect(status.textContent).not.toContain("Premier");
  });

  it("propose une action qui s'exécute puis ferme le message", async () => {
    const onAction = vi.fn();
    renderToast(<Trigger text="Reportée" options={{ action: { label: "Annuler", onAction } }} />);
    await userEvent.click(screen.getByRole("button", { name: "Reportée" }));
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("se ferme au bouton", async () => {
    renderToast(<Trigger text="Fait" />);
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("useToast hors fournisseur échoue franchement", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger text="x" />)).toThrow("ToastProvider");
    error.mockRestore();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderToast(
      <Trigger text="Fait" options={{ action: { label: "Annuler", onAction: () => undefined } }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fait" }));
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
