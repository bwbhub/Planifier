// @vitest-environment jsdom
import { ORPCError } from "@orpc/client";
import type { ImportSubscriptionOutput } from "@planifier/api-contract";
import { axeViolations } from "@planifier/ui/testing/axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { replyRpc } from "@/lib/testing/rpc-fetch";

import { ImportsView } from "./imports-view";

const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", mock);
  return mock;
});

afterEach(() => {
  vi.clearAllMocks();
});

const GOOGLE: ImportSubscriptionOutput = {
  id: "0199f3a2-7c4e-7d10-9a51-00000000c001",
  label: "Google perso",
  urlHint: "calendar.google.com",
  lastFetchedAt: new Date(Date.now() - 3 * 3_600_000),
  lastError: null,
};

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ImportsView />
    </QueryClientProvider>,
  );
}

describe("ImportsView, lecture", () => {
  it("invite à coller un lien quand rien n'est importé", async () => {
    replyRpc(fetchMock, { "agenda/imports/list": { data: { items: [] } } });
    const { container } = renderView();
    expect(await screen.findByText("Aucun agenda importé")).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("liste les agendas avec leur hôte et leur dernière lecture, sans lien", async () => {
    replyRpc(fetchMock, { "agenda/imports/list": { data: { items: [GOOGLE] } } });
    renderView();
    expect(await screen.findByText("Google perso")).toBeTruthy();
    expect(screen.getByText(/calendar\.google\.com · Actualisé il y a 3 heures/)).toBeTruthy();
  });

  it("dit pourquoi la dernière lecture a échoué", async () => {
    replyRpc(fetchMock, {
      "agenda/imports/list": { data: { items: [{ ...GOOGLE, lastError: "FEED_UNREACHABLE" }] } },
    });
    renderView();
    expect((await screen.findByRole("alert")).textContent).toContain("n'a pas répondu");
  });

  it("explique une erreur de lecture de la liste, avec « Réessayer »", async () => {
    replyRpc(fetchMock, {
      "agenda/imports/list": { error: new ORPCError("INTERNAL_SERVER_ERROR") },
    });
    renderView();
    expect(await screen.findByRole("button", { name: "Réessayer" })).toBeTruthy();
  });
});

describe("ImportsView, ajout", () => {
  it("demande un nom et un lien, sans rien envoyer", async () => {
    replyRpc(fetchMock, { "agenda/imports/list": { data: { items: [] } } });
    renderView();
    await screen.findByText("Aucun agenda importé");
    fetchMock.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Importer" }));
    expect(screen.getByLabelText("Nom").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Lien privé").getAttribute("aria-invalid")).toBe("true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("importe un lien puis vide le formulaire", async () => {
    const calls = replyRpc(fetchMock, {
      "agenda/imports/list": { data: { items: [] } },
      "agenda/imports/create": { data: GOOGLE },
    });
    renderView();
    await userEvent.type(await screen.findByLabelText("Nom"), "Google perso");
    await userEvent.type(
      screen.getByLabelText("Lien privé"),
      "https://calendar.google.com/calendar/ical/x/basic.ics",
    );
    await userEvent.click(screen.getByRole("button", { name: "Importer" }));
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Nom").value).toBe("");
    });
    expect(calls.find(({ path }) => path === "agenda/imports/create")?.input).toEqual({
      label: "Google perso",
      url: "https://calendar.google.com/calendar/ical/x/basic.ics",
    });
  });

  it("garde la saisie et dit la raison quand le lien est refusé", async () => {
    replyRpc(fetchMock, {
      "agenda/imports/list": { data: { items: [] } },
      "agenda/imports/create": {
        error: new ORPCError("BAD_REQUEST", { data: { reason: "LINK_INVALID" } }),
      },
    });
    renderView();
    await userEvent.type(await screen.findByLabelText("Nom"), "Autre");
    await userEvent.type(screen.getByLabelText("Lien privé"), "https://exemple.fr/a.ics");
    await userEvent.click(screen.getByRole("button", { name: "Importer" }));
    expect((await screen.findByRole("alert")).textContent).toContain("service admis");
    expect(screen.getByLabelText<HTMLInputElement>("Nom").value).toBe("Autre");
  });
});

describe("ImportsView, actions sur un agenda", () => {
  it("actualise un agenda", async () => {
    const calls = replyRpc(fetchMock, {
      "agenda/imports/list": { data: { items: [GOOGLE] } },
      "agenda/imports/refresh": { data: GOOGLE },
    });
    renderView();
    await userEvent.click(await screen.findByRole("button", { name: "Actualiser" }));
    await waitFor(() => {
      expect(calls.some(({ path }) => path === "agenda/imports/refresh")).toBe(true);
    });
    expect(calls.find(({ path }) => path === "agenda/imports/refresh")?.input).toEqual({
      subscriptionId: GOOGLE.id,
    });
  });

  it("demande confirmation avant de retirer, puis retire", async () => {
    const calls = replyRpc(fetchMock, {
      "agenda/imports/list": { data: { items: [GOOGLE] } },
      "agenda/imports/delete": { data: {} },
    });
    renderView();
    await userEvent.click(await screen.findByRole("button", { name: "Retirer" }));
    expect(calls.some(({ path }) => path === "agenda/imports/delete")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Retirer l'agenda" }));
    await waitFor(() => {
      expect(calls.some(({ path }) => path === "agenda/imports/delete")).toBe(true);
    });
  });
});
