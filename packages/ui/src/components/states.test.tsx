import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

describe("états de chargement et de vide", () => {
  it("Skeleton est décoratif : rien à lire ni à atteindre", () => {
    const { container } = render(<Skeleton shape="card" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toBe("");
  });

  it("EmptyState dit ce qui manque, ce qu'on peut faire, et offre l'action", async () => {
    const onCreate = vi.fn();
    render(
      <EmptyState
        title="Aucune liste pour l'instant"
        description="Une liste réunit des tâches."
        action={<button onClick={onCreate}>Créer ma première liste</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aucune liste pour l'instant" })).toBeTruthy();
    expect(screen.getByText("Une liste réunit des tâches.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Créer ma première liste" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
