import { afterEach, describe, expect, it, vi } from "vitest";

import type { Mail, SendMail } from "../mail";
import { restrictToDomains } from "./allowed-domains";

const mailTo = (to: string): Mail => ({
  to,
  subject: "Sujet",
  html: "<p>Corps</p>",
  text: "Corps",
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("restrictToDomains", () => {
  it("envoie aux domaines listés, quelle que soit la casse", async () => {
    const send = vi.fn<SendMail>(() => Promise.resolve());
    await restrictToDomains(send, ["planifier.test"])(mailTo("Eve@Planifier.TEST"));
    expect(send).toHaveBeenCalledOnce();
  });

  it("écarte les autres domaines sans erreur, et journalise sans l'adresse", async () => {
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const send = vi.fn<SendMail>(() => Promise.resolve());
    await expect(
      restrictToDomains(send, ["planifier.test"])(mailTo("eve@ailleurs.example")),
    ).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
    expect(String(log.mock.calls[0]?.[0])).not.toContain("eve@");
  });
});
