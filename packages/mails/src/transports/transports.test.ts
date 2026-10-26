import { describe, expect, it, vi } from "vitest";

import type { Mail } from "../mail";
import { createMailpitTransport } from "./mailpit";
import type { Fetch } from "./post-json";
import { createResendTransport } from "./resend";

const MAIL: Mail = {
  to: "eve@example.test",
  subject: "Sujet",
  html: "<p>Corps</p>",
  text: "Corps",
};
const FROM = "bonjour@planifier.test";

/** Faux `fetch` qui répond `status` et garde chaque appel. */
function fakeFetch(status: number) {
  return vi.fn<Fetch>(() => Promise.resolve(new Response("{}", { status })));
}

function sentRequest(fetchFn: ReturnType<typeof fakeFetch>) {
  const [url, init] = fetchFn.mock.calls[0] ?? [];
  const body: unknown = JSON.parse(typeof init?.body === "string" ? init.body : "null");
  return { url, headers: new Headers(init?.headers), body };
}

describe("createResendTransport", () => {
  it("poste l'e-mail à Resend avec la clé d'API", async () => {
    const fetchFn = fakeFetch(200);
    await createResendTransport("cle-de-test", FROM, fetchFn)(MAIL);

    const { url, headers, body } = sentRequest(fetchFn);
    expect(url).toBe("https://api.resend.com/emails");
    expect(headers.get("authorization")).toBe("Bearer cle-de-test");
    expect(body).toEqual({
      from: `Planifier <${FROM}>`,
      to: [MAIL.to],
      subject: MAIL.subject,
      html: MAIL.html,
      text: MAIL.text,
    });
  });

  it("rejette sans citer l'adresse quand Resend refuse", async () => {
    const send = createResendTransport("cle-de-test", FROM, fakeFetch(422));
    await expect(send(MAIL)).rejects.toThrow("HTTP 422");
    await expect(send(MAIL)).rejects.not.toThrow(MAIL.to);
  });
});

describe("createMailpitTransport", () => {
  it("dépose l'e-mail dans Mailpit par son API", async () => {
    const fetchFn = fakeFetch(200);
    await createMailpitTransport("http://localhost:8025", FROM, fetchFn)(MAIL);

    const { url, body } = sentRequest(fetchFn);
    expect(url).toBe("http://localhost:8025/api/v1/send");
    expect(body).toEqual({
      From: { Email: FROM, Name: "Planifier" },
      To: [{ Email: MAIL.to }],
      Subject: MAIL.subject,
      HTML: MAIL.html,
      Text: MAIL.text,
    });
  });
});
