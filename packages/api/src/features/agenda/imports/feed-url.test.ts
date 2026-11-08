import { describe, expect, it } from "vitest";

import { isAllowedFeedHost, parseFeedUrl } from "./feed-url";

const GOOGLE = "https://calendar.google.com/calendar/ical/abc%40gmail.com/private-xyz/basic.ics";

describe("parseFeedUrl", () => {
  it.each([
    GOOGLE,
    "  https://outlook.office365.com/owa/calendar/x/y/calendar.ics  ",
    "https://outlook.live.com/owa/calendar/x/y/calendar.ics",
    "https://p12-caldav.icloud.com/published/2/abc",
    "webcal://p12-caldav.icloud.com/published/2/abc",
    "WEBCALS://Calendar.Google.com/x.ics",
  ])("accepte %j", (input) => {
    const result = parseFeedUrl(input);

    expect(result.ok).toBe(true);
    expect(result.ok && result.url.protocol).toBe("https:");
  });

  it("garde le chemin et la requête intacts (le lien privé est un secret)", () => {
    const result = parseFeedUrl("webcal://p12-caldav.icloud.com/published/2/abc?x=1");

    expect(result.ok && result.url.toString()).toBe(
      "https://p12-caldav.icloud.com/published/2/abc?x=1",
    );
  });

  it.each([
    ["", "INVALID"],
    ["pas une adresse", "INVALID"],
    ["http://calendar.google.com/x.ics", "INVALID"],
    ["ftp://calendar.google.com/x.ics", "INVALID"],
    ["file:///etc/passwd", "INVALID"],
    ["https://user:pass@calendar.google.com/x.ics", "INVALID"],
    ["https://calendar.google.com:8443/x.ics", "INVALID"],
    [`https://calendar.google.com/${"a".repeat(2100)}`, "INVALID"],
    ["https://evil.example/x.ics", "HOST_NOT_ALLOWED"],
    ["https://calendar.google.com.evil.example/x.ics", "HOST_NOT_ALLOWED"],
    ["https://evilcalendar.google.com/x.ics", "HOST_NOT_ALLOWED"],
    ["https://icloud.com/x.ics", "HOST_NOT_ALLOWED"],
    ["https://p12-caldav.icloud.com.evil.example/x", "HOST_NOT_ALLOWED"],
    ["https://127.0.0.1/x.ics", "HOST_NOT_ALLOWED"],
    ["https://[::1]/x.ics", "HOST_NOT_ALLOWED"],
    ["https://localhost/x.ics", "HOST_NOT_ALLOWED"],
    ["https://169.254.169.254/latest/meta-data", "HOST_NOT_ALLOWED"],
  ])("refuse %j (%s)", (input, reason) => {
    expect(parseFeedUrl(input)).toEqual({ ok: false, reason });
  });

  it("admet des hôtes ajoutés par l'appelant, et eux seuls", () => {
    expect(parseFeedUrl("https://feeds.test/x.ics", ["feeds.test"]).ok).toBe(true);
    expect(parseFeedUrl("https://feeds.test/x.ics").ok).toBe(false);
  });
});

describe("isAllowedFeedHost", () => {
  it("ne prend pas un sous-domaine pour son parent", () => {
    expect(isAllowedFeedHost("calendar.google.com")).toBe(true);
    expect(isAllowedFeedHost("a.calendar.google.com")).toBe(false);
  });
});
