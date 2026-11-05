// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { entryWith, itemWith } from "../testing/agenda-fixtures";
import type { AgendaItem } from "../utils/agenda-items";
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

function renderGrid(items: readonly AgendaItem[], days = ["2026-11-05"]) {
  const onOpen = vi.fn();
  const view = render(
    <TimeGrid
      days={days}
      day="2026-11-05"
      today="2026-11-05"
      items={items}
      dayHref={(day) => `/agenda?jour=${day}`}
      onOpen={onOpen}
    />,
  );
  return { ...view, onOpen };
}

describe("TimeGrid", () => {
  it("ouvre mon entrée et dit qu'elle est masquée", async () => {
    const { onOpen } = renderGrid([MINE]);
    await userEvent.click(screen.getByRole("button", { name: /Dentiste.*masquée/ }));
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
