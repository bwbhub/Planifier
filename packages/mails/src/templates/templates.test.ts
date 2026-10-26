import { describe, expect, it } from "vitest";

import { resetPasswordMail } from "./reset-password";
import { verifyEmailMail } from "./verify-email";

const URL = "https://planifier.test/api/auth/verify-email?token=abc&callbackURL=%2Fconnexion";

describe.each([
  ["verifyEmailMail", verifyEmailMail],
  ["resetPasswordMail", resetPasswordMail],
])("%s", (_, template) => {
  it("met le lien dans le bouton et dans la version texte", () => {
    const mail = template({ name: "Eve", url: URL });
    expect(mail.html).toContain(`href="${URL.replaceAll("&", "&amp;")}"`);
    expect(mail.text).toContain(URL);
    expect(mail.html.startsWith("<!DOCTYPE html")).toBe(true);
  });

  it("échappe le nom affiché dans le HTML", () => {
    const mail = template({ name: "<b>Eve</b>", url: URL });
    expect(mail.html).not.toContain("<b>Eve</b>");
    expect(mail.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
  });

  it("dit combien de temps le lien reste valable", () => {
    expect(template({ name: "Eve", url: URL }).text).toContain("valable 60 minutes");
  });
});
