// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SlotBlock, type SlotBlockProps } from "./slot-block";

function renderBlock(props: Partial<SlotBlockProps> = {}) {
  return render(
    <SlotBlock
      interactive={false}
      title="Dentiste"
      time="09:00 – 10:00"
      background="bg-tint-work"
      {...props}
    />,
  );
}

describe("SlotBlock", () => {
  it("montre le titre et l'horaire", () => {
    renderBlock();
    expect(screen.getByText("Dentiste")).toBeTruthy();
    expect(screen.getByText("09:00 – 10:00")).toBeTruthy();
  });

  it("dit « Peut-être » et « Tâche faite » en mots, pas seulement par le style", () => {
    renderBlock({ maybe: true, greyed: true });
    expect(screen.getByText("Peut-être")).toBeTruthy();
    expect(screen.getByText("Tâche faite")).toBeTruthy();
  });

  it("n'ajoute aucune mention sans état", () => {
    renderBlock();
    expect(screen.queryByText("Peut-être")).toBeNull();
    expect(screen.queryByText("Tâche faite")).toBeNull();
  });

  it("se lit seulement en groupe, s'ouvre au clic en bouton", async () => {
    const onClick = vi.fn();
    const { unmount } = renderBlock();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("group")).toBeTruthy();
    unmount();
    renderBlock({ interactive: true, onClick, "aria-label": "Dentiste, 09:00" });
    await userEvent.click(screen.getByRole("button", { name: "Dentiste, 09:00" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("pose les bordures par état, « peut-être » avant « masqué », et estompe le grisé", () => {
    const { rerender } = renderBlock({ hidden: true });
    expect(screen.getByRole("group").className).toContain("border-muted");
    rerender(
      <SlotBlock
        interactive={false}
        title="Dentiste"
        time="09:00"
        background="bg-tint-work"
        hidden
        maybe
      />,
    );
    const block = screen.getByRole("group");
    expect(block.className).toContain("border-accent-text");
    expect(block.className).not.toContain("border-muted");
    rerender(
      <SlotBlock
        interactive={false}
        title="Dentiste"
        time="09:00"
        background="bg-tint-work"
        greyed
      />,
    );
    expect(screen.getByRole("group").className).toContain("opacity-60");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderBlock({ maybe: true, greyed: true, hidden: true });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
