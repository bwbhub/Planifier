import { describe, expect, it } from "vitest";

import { inviteLinkOf, inviteTokenOf } from "./invite-link";

const TOKEN = "Hq3vY0dK2mZr8s_LpQw-1nTe5uXbC7aJ4oGfIhE9x9A";

describe("inviteLinkOf", () => {
  it("place le jeton dans le fragment, hors du chemin envoyé au serveur", () => {
    const link = new URL(inviteLinkOf("https://planifier.example", TOKEN));
    expect(link.pathname).toBe("/rejoindre");
    expect(link.search).toBe("");
    expect(link.hash).toBe(`#${TOKEN}`);
  });
});

describe("inviteTokenOf", () => {
  it("relit le jeton d'un lien", () => {
    expect(inviteTokenOf(`#${TOKEN}`)).toBe(TOKEN);
  });

  it("refuse un fragment vide ou mal formé", () => {
    expect(inviteTokenOf("")).toBeNull();
    expect(inviteTokenOf("#court")).toBeNull();
    expect(inviteTokenOf(`#${TOKEN}<script>`)).toBeNull();
  });
});
