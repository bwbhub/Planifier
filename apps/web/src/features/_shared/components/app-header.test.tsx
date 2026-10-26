// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { axeViolations } from "@planifier/ui/testing/axe";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "./app-header";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("AppHeader", () => {
  it("mène au profil par un bouton à part, marqué comme page courante sur le profil", () => {
    pathname.current = "/";
    const { unmount } = render(<AppHeader />);
    const profile = screen.getByRole("link", { name: "Profil" });
    expect(profile.getAttribute("href")).toBe("/profil");
    expect(profile.hasAttribute("aria-current")).toBe(false);
    unmount();

    pathname.current = "/profil";
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Profil" }).getAttribute("aria-current")).toBe("page");
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = render(<AppHeader />);
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
