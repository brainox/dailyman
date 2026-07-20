import { describe, it, expect } from "vitest";
import { toISODate, todayISO, addDays, yesterdayOf, lastNDays } from "../../src/lib/date";

describe("toISODate", () => {
  it("formats a Date as local YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 6, 20))).toBe("2026-07-20");
  });

  it("zero-pads single-digit months and days", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("todayISO", () => {
  it("matches toISODate(new Date())", () => {
    expect(todayISO()).toBe(toISODate(new Date()));
  });
});

describe("addDays", () => {
  it("adds days within the same month", () => {
    expect(addDays("2026-07-20", 3)).toBe("2026-07-23");
  });

  it("subtracts days across a month boundary", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });

  it("handles year boundaries", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("yesterdayOf", () => {
  it("returns the previous calendar day", () => {
    expect(yesterdayOf("2026-07-20")).toBe("2026-07-19");
  });
});

describe("lastNDays", () => {
  it("returns n days ending at the given date, oldest first", () => {
    const days = lastNDays(5, "2026-07-20");
    expect(days).toEqual([
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
    ]);
  });

  it("returns exactly 30 days for the heatmap window", () => {
    const days = lastNDays(30, "2026-07-20");
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("2026-06-21");
    expect(days[29]).toBe("2026-07-20");
  });

  it("defaults to ending today when no end date is given", () => {
    const days = lastNDays(1);
    expect(days).toEqual([todayISO()]);
  });
});
