// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AgendaItem } from "../utils/agenda-items";
import { MonthGrid } from "./month-grid";

const TEAM_LUNCH: AgendaItem = {
  id: "1",
  title: "Déjeuner",
  location: "Cantine",
  participants: [],
  when: {
    allDay: false,
    startsAt: new Date("2026-11-05T12:00"),
    endsAt: new Date("2026-11-05T13:00"),
  },
  background: "bg-tint-work",
  owner: { userId: "bob", name: "Bob" },
  entry: null,
};

const DAYS = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"];

function renderMonth(items: readonly AgendaItem[]) {
  return render(
    <MonthGrid
      days={DAYS}
      day="2026-11-05"
      today="2026-11-02"
      items={items}
      dayHref={(day) => `/agenda?jour=${day}`}
    />,
  );
}

describe("MonthGrid", () => {
  it("fait de chaque case un lien vers son jour, qui dit tout ce qu'elle montre", () => {
    renderMonth([TEAM_LUNCH]);
    const cell = screen.getByRole("link", { name: /^jeudi 5 novembre ; Déjeuner/ });
    expect(cell.getAttribute("href")).toBe("/agenda?jour=2026-11-05");
    expect(cell.getAttribute("aria-label")).toContain("12:00 – 13:00, Cantine, Bob");
  });

  it("n'offre aucun bouton dans une case", () => {
    renderMonth([TEAM_LUNCH]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("compte ce qui dépasse", () => {
    const many = ["a", "b", "c", "d"].map((id) => ({ ...TEAM_LUNCH, id }));
    renderMonth(many);
    expect(screen.getByText("+1")).toBeDefined();
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderMonth([TEAM_LUNCH]);
    expect(await axeViolations(container)).toEqual([]);
  });
});
