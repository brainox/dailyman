import { describe, it, expect } from "vitest";
import { computeStreak } from "../../src/lib/streak";
import type { DailyEntry } from "../../src/lib/types";

const TODAY = "2026-07-20";

function complete(date: string): DailyEntry {
  return { date, completionStatus: "complete", commitment: "x", reflection: "y" };
}
function incomplete(date: string): DailyEntry {
  return { date, completionStatus: "incomplete", commitment: "x", blocker: "y" };
}
function pending(date: string): DailyEntry {
  return { date, completionStatus: "pending", commitment: "x" };
}

describe("computeStreak (data-model.md computation rule, FR-007, FR-013)", () => {
  it("returns 0 with no entries at all (first-ever day)", () => {
    expect(computeStreak([], TODAY)).toEqual({ currentLength: 0, startDate: null });
  });

  it("counts consecutive complete days ending yesterday when today is not yet resolved", () => {
    const entries = [complete("2026-07-18"), complete("2026-07-19")];
    expect(computeStreak(entries, TODAY)).toEqual({
      currentLength: 2,
      startDate: "2026-07-18",
    });
  });

  it("excludes today from the walk while today is still pending/in-progress", () => {
    const entries = [complete("2026-07-19"), pending(TODAY)];
    expect(computeStreak(entries, TODAY)).toEqual({
      currentLength: 1,
      startDate: "2026-07-19",
    });
  });

  it("includes today once today itself is resolved complete", () => {
    const entries = [complete("2026-07-19"), complete(TODAY)];
    expect(computeStreak(entries, TODAY)).toEqual({
      currentLength: 2,
      startDate: "2026-07-19",
    });
  });

  it("hard-resets to 0 on an incomplete day, with no grace period", () => {
    const entries = [complete("2026-07-17"), complete("2026-07-18"), incomplete("2026-07-19")];
    expect(computeStreak(entries, TODAY)).toEqual({ currentLength: 0, startDate: null });
  });

  it("hard-resets to 0 on a fully-missed day (no entry at all)", () => {
    // 07-18 has no entry -> streak breaks even though 07-19 is complete.
    const entries = [complete("2026-07-17"), complete("2026-07-19")];
    expect(computeStreak(entries, TODAY)).toEqual({
      currentLength: 1,
      startDate: "2026-07-19",
    });
  });

  it("self-corrects after the app was closed for multiple days (no stored counter to desync)", () => {
    // Simulates reopening after a week away: only the last 2 days before today are complete.
    const entries = [
      complete("2026-07-08"),
      complete("2026-07-09"),
      incomplete("2026-07-15"),
      complete("2026-07-18"),
      complete("2026-07-19"),
    ];
    expect(computeStreak(entries, TODAY)).toEqual({
      currentLength: 2,
      startDate: "2026-07-18",
    });
  });

  it("treats an abandoned pending day in the past the same as incomplete", () => {
    const entries = [complete("2026-07-18"), pending("2026-07-19")];
    expect(computeStreak(entries, TODAY)).toEqual({ currentLength: 0, startDate: null });
  });
});
