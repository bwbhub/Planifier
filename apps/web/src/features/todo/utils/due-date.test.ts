import { describe, expect, it } from "vitest";

import { dueLabel, formatDueDate, isPastDue } from "./due-date";

describe("échéance", () => {
  it("n'écrit l'année que si elle diffère de l'année en cours", () => {
    expect(formatDueDate("2026-11-05", "2026-10-28")).toBe("5 novembre");
    expect(formatDueDate("2025-11-05", "2026-10-28")).toBe("5 novembre 2025");
  });

  it("une échéance n'est passée qu'à partir du lendemain", () => {
    expect(isPastDue("2026-10-27", "2026-10-28")).toBe(true);
    expect(isPastDue("2026-10-28", "2026-10-28")).toBe(false);
  });

  it("ajoute l'heure à l'échéance quand il y en a une", () => {
    expect(dueLabel("2026-11-05", null, "2026-10-28")).toBe("5 novembre");
    expect(dueLabel("2026-11-05", "09:30", "2026-10-28")).toBe("5 novembre à 09:30");
  });
});
