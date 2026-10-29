import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { axeViolations } from "../testing/axe";
import { Avatar } from "./avatar";
import { ListSkeleton } from "./list-skeleton";
import { LoadError } from "./load-error";
import { MessageCard } from "./message-card";
import { SectionTitle, SettingCard, SettingRow } from "./setting-list";

describe("blocs d'écran", () => {
  it("ListSkeleton annonce ce qui charge, sans lire les lignes fantômes", () => {
    render(<ListSkeleton label="Chargement des Espaces…" rows={3} />);
    expect(screen.getByRole("status").textContent).toBe("Chargement des Espaces…");
  });

  it("LoadError s'annonce et relance au clic", async () => {
    const onRetry = vi.fn();
    render(<LoadError message="Rien n'est perdu." retryLabel="Réessayer" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("Rien n'est perdu.");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("Avatar est décoratif : le nom se lit ailleurs", () => {
    const { container } = render(<Avatar id="u-1" name="alice" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toBe("A");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(
      <main>
        <MessageCard title="Aucun Espace" level={1}>
          <p>Crée le premier.</p>
        </MessageCard>
        <SectionTitle id="membres">Membres</SectionTitle>
        <SettingCard label="Membres">
          <SettingRow
            title="Alice"
            hint="A créé l'Espace"
            leading={<Avatar id="u-1" name="Alice" />}
          />
        </SettingCard>
        <ListSkeleton label="Chargement…" />
        <LoadError message="Échec." retryLabel="Réessayer" onRetry={() => undefined} />
      </main>,
    );
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
