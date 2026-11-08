// @vitest-environment jsdom
import { axeViolations } from "@planifier/ui/testing/axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskLine, type TaskLineProps } from "./task-line";

function renderLine(props: Partial<TaskLineProps> = {}) {
  return render(
    <ul>
      <li>
        <TaskLine title="Acheter du pain" done={false} {...props} />
      </li>
    </ul>,
  );
}

describe("TaskLine", () => {
  it("coche et décoche au geste de l'utilisateur, en disant l'état demandé", async () => {
    const onToggle = vi.fn();
    renderLine({ onToggle });
    await userEvent.click(screen.getByRole("checkbox", { name: "Acheter du pain" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("ouvre le détail au toucher du titre, sans cocher ; la case garde le nom de la tâche", async () => {
    const onOpen = vi.fn();
    const onToggle = vi.fn();
    renderLine({ onOpen, onToggle });
    await userEvent.click(screen.getByRole("button", { name: "Ouvrir : Acheter du pain" }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onToggle).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("checkbox", { name: "Acheter du pain" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("montre l'état sans geste possible quand rien ne la coche (lecture seule)", () => {
    renderLine({ done: true });
    const box = screen.getByRole("checkbox", { name: "Acheter du pain" });
    expect(box).toHaveProperty("checked", true);
    expect(box).toHaveProperty("disabled", true);
  });

  it("dit les sous-tâches en pastille « 2/4 » et en toutes lettres aux lecteurs d'écran", () => {
    renderLine({ subtasks: { done: 2, total: 4, label: "2 sur 4 sous-tâches cochées" } });
    expect(screen.getByText("2/4")).toBeTruthy();
    expect(screen.getByText("2 sur 4 sous-tâches cochées")).toBeTruthy();
  });

  it("nomme la personne assignée et celle qui a coché", () => {
    renderLine({
      done: true,
      assignee: { userId: "u-1", name: "Camille" },
      completedByName: "Julien",
    });
    expect(screen.getByText("Assignée à Camille")).toBeTruthy();
    expect(screen.getByText("Cochée par Julien")).toBeTruthy();
  });

  it("n'écrit rien de plus quand il n'y a ni assigné ni coche d'une autre personne", () => {
    renderLine();
    expect(screen.queryByText(/Assignée à/)).toBeNull();
    expect(screen.queryByText(/Cochée par/)).toBeNull();
  });

  it("s'atténue quand elle n'est pas pour moi, et garde ses détails et ses actions", () => {
    const { container } = renderLine({
      dimmed: true,
      details: <span>Pour le 3 juillet</span>,
      actions: <button>Modifier</button>,
    });
    expect(container.querySelector("[data-dimmed]")).not.toBeNull();
    expect(screen.getByText("Pour le 3 juillet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeTruthy();
  });

  it("ne présente aucune violation d'accessibilité en lecture seule (case désactivée)", async () => {
    const { container } = renderLine({ done: true });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });

  it("ne présente aucune violation d'accessibilité", async () => {
    const { container } = renderLine({
      onToggle: () => undefined,
      subtasks: { done: 1, total: 2, label: "1 sur 2 sous-tâches cochée" },
      assignee: { userId: "u-1", name: "Camille" },
      details: <span>Pour le 3 juillet</span>,
    });
    await expect(axeViolations(container)).resolves.toEqual([]);
  });
});
