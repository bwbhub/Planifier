import { describe, expect, it } from "vitest";

import { parseMailEnv } from "./env";

const MAILPIT = {
  NODE_ENV: "development",
  MAIL_FROM: "bonjour@planifier.test",
  MAIL_TRANSPORT: "mailpit",
  MAILPIT_URL: "http://localhost:8025",
};

describe("parseMailEnv", () => {
  it("accepte Mailpit hors production", () => {
    expect(parseMailEnv(MAILPIT).MAIL_TRANSPORT).toBe("mailpit");
  });

  it("refuse Mailpit en production", () => {
    expect(() => parseMailEnv({ ...MAILPIT, NODE_ENV: "production" })).toThrow();
  });

  it("refuse Resend sans clé d'API", () => {
    expect(() => parseMailEnv({ ...MAILPIT, MAIL_TRANSPORT: "resend" })).toThrow();
  });

  it("lit la liste des domaines du bac à sable, sans espaces ni casse", () => {
    const env = parseMailEnv({ ...MAILPIT, MAIL_ALLOWED_DOMAINS: " Planifier.test, ,exemple.fr" });
    expect(env.MAIL_ALLOWED_DOMAINS).toEqual(["planifier.test", "exemple.fr"]);
  });

  it("refuse une adresse d'expédition invalide", () => {
    expect(() => parseMailEnv({ ...MAILPIT, MAIL_FROM: "Planifier" })).toThrow();
  });
});
