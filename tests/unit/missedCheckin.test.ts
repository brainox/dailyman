import { describe, it, expect } from "vitest";
import { detectMissedCheckin } from "../../src/lib/missedCheckin";
import type { DailyEntry } from "../../src/lib/types";

describe("detectMissedCheckin (FR-010)", () => {
  it("returns null when there is no entry for yesterday", () => {
    expect(detectMissedCheckin(undefined, undefined)).toBeNull();
  });

  it("returns null when yesterday's morning check-in never produced a commitment", () => {
    const yesterday: DailyEntry = {
      date: "2026-07-19",
      avoidance: "the tax filing",
      completionStatus: "pending",
    };
    expect(detectMissedCheckin(yesterday, undefined)).toBeNull();
  });

  it("returns null when yesterday's night check-in was already resolved (complete)", () => {
    const yesterday: DailyEntry = {
      date: "2026-07-19",
      commitment: "outline the report",
      completionStatus: "complete",
      reflection: "done",
    };
    expect(detectMissedCheckin(yesterday, undefined)).toBeNull();
  });

  it("returns null when yesterday's night check-in was already resolved (incomplete)", () => {
    const yesterday: DailyEntry = {
      date: "2026-07-19",
      commitment: "outline the report",
      completionStatus: "incomplete",
      blocker: "meetings",
    };
    expect(detectMissedCheckin(yesterday, undefined)).toBeNull();
  });

  it("detects a missed check-in: commitment set, night never resolved", () => {
    const yesterday: DailyEntry = {
      date: "2026-07-19",
      commitment: "outline the report",
      completionStatus: "pending",
    };
    expect(detectMissedCheckin(yesterday, undefined)).toEqual({
      date: "2026-07-19",
      commitment: "outline the report",
    });
  });

  it("returns null once today's entry already records the acknowledgment", () => {
    const yesterday: DailyEntry = {
      date: "2026-07-19",
      commitment: "outline the report",
      completionStatus: "pending",
    };
    const today: DailyEntry = {
      date: "2026-07-20",
      completionStatus: "pending",
      acknowledgedMissedPrior: true,
      acknowledgmentResponse: "I fell asleep early",
    };
    expect(detectMissedCheckin(yesterday, today)).toBeNull();
  });
});
