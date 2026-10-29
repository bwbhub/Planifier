import { describe, expect, it } from "vitest";

import { formatDueDate, isPastDue, today } from "./due-date";

describe("échéance", () => {
  it("donne le jour de l'appareil", () => {
    expect(today(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("n'écrit l'année que si elle diffère de l'année en cours", () => {
    expect(formatDueDate("2026-11-05", "2026-10-28")).toBe("5 novembre");
    expect(formatDueDate("2025-11-05", "2026-10-28")).toBe("5 novembre 2025");
  });

  it("une échéance n'est passée qu'à partir du lendemain", () => {
    expect(isPastDue("2026-10-27", "2026-10-28")).toBe(true);
    expect(isPastDue("2026-10-28", "2026-10-28")).toBe(false);
  });
});
