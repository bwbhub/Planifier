// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { entryWith, itemWith } from "../testing/agenda-fixtures";
import type { AgendaItem } from "../utils/agenda-items";
import { HOLD_MS } from "../utils/use-entry-move";
import { TimeGrid } from "./time-grid";

const OTHERS = itemWith({
  id: "autre",
  title: "Réunion",
  background: "bg-tint-work",
  owner: { userId: "bob", name: "Bob" },
});

const MINE = itemWith({
  id: "mienne",
  title: "Dentiste",
  entry: entryWith({ id: "mienne", title: "Dentiste", hidden: true }),
});

/** jsdom ne place rien à l'écran : ce que `elementFromPoint` trouve sous le doigt, au choix du test. */
let pointed: () => Element | null = () => null;
const column = () => document.querySelector("[data-move-first-hour]");

beforeEach(() => {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => pointed(),
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "elementFromPoint");
  pointed = () => null;
  vi.useRealTimers();
});

/** Appui long au doigt sur une entrée de la colonne. */
function lift(entry: HTMLElement) {
  vi.useFakeTimers();
  pointed = column;
  fireEvent.pointerDown(entry, { pointerType: "touch" });
  act(() => {
    vi.advanceTimersByTime(HOLD_MS);
  });
}

function renderGrid(items: readonly AgendaItem[], days = ["2026-11-05"]) {
  const onOpen = vi.fn();
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <TimeGrid
        days={days}
        day="2026-11-05"
        today="2026-11-05"
        items={items}
        dayHref={(day) => `/agenda?jour=${day}`}
        onOpen={onOpen}
      />
    </QueryClientProvider>,
  );
  return { ...view, onOpen };
}

describe("TimeGrid", () => {
  it("ouvre mon entrée et dit qu'elle est masquée", async () => {
    const { onOpen } = renderGrid([MINE]);
    await userEvent.click(screen.getByRole("button", { name: /Dentiste.*masquée/ }));
    expect(onOpen).toHaveBeenCalledWith(MINE);
  });

  it("décolle mon entrée après un appui long, et la repose si on annule", () => {
    renderGrid([MINE]);
    lift(screen.getByRole("button", { name: /Dentiste/ }));
    expect(screen.getByRole("status").textContent).toContain("« Dentiste » est décollée");
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("avale le clic qui suit l'appui long, puis l'annule si on retouche l'entrée", () => {
    const { onOpen } = renderGrid([MINE]);
    const entry = screen.getByRole("button", { name: /Dentiste/ });
    lift(entry);
    fireEvent.click(entry);
    expect(screen.getByRole("status").textContent).toContain("est décollée");
    act(() => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    fireEvent.click(entry);
    expect(screen.getByRole("status").textContent).toBe("");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("garde l'entrée décollée quand on touche hors des créneaux", () => {
    renderGrid([MINE]);
    lift(screen.getByRole("button", { name: /Dentiste/ }));
    act(() => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    pointed = () => null;
    fireEvent.click(screen.getByRole("link", { name: "jeudi 5 novembre" }));
    expect(screen.getByRole("status").textContent).toContain("est décollée");
  });

  it("ouvre l'entrée au clic suivant, sans rien avaler", () => {
    const { onOpen } = renderGrid([MINE]);
    const entry = screen.getByRole("button", { name: /Dentiste/ });
    lift(entry);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    act(() => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    fireEvent.click(entry);
    expect(onOpen).toHaveBeenCalledWith(MINE);
  });

  it("n'offre aucun bouton sur l'entrée d'une autre personne", () => {
    renderGrid([OTHERS]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByLabelText(/Réunion.*Bob/)).toBeTruthy();
  });

  it("donne la bande de la semaine en vue Jour", () => {
    renderGrid([]);
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(
      screen.getByRole("link", { name: "jeudi 5 novembre" }).getAttribute("aria-current"),
    ).toBe("date");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderGrid([MINE, OTHERS]);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
