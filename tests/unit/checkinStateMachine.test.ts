import { describe, it, expect } from "vitest";
import {
  deriveCheckinPhase,
  canStartMorningCheckin,
  canStartNightCheckin,
  canSubmitNightOutcome,
} from "../../src/state/checkinPhase";
import type { DailyEntry } from "../../src/lib/types";

function entry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return { date: "2026-07-20", completionStatus: "pending", ...overrides };
}

describe("deriveCheckinPhase (data-model.md state diagram)", () => {
  it("no entry -> no-entry", () => {
    expect(deriveCheckinPhase(undefined)).toBe("no-entry");
  });

  it("avoidance answered but no commitment yet -> morning-in-progress", () => {
    expect(
      deriveCheckinPhase(entry({ avoidance: "the tax filing", morningFollowup: "what's a 30-minute version?" })),
    ).toBe("morning-in-progress");
  });

  it("commitment set, night not yet resolved -> commitment-set", () => {
    expect(deriveCheckinPhase(entry({ commitment: "outline the report" }))).toBe(
      "commitment-set",
    );
  });

  it("night resolved yes -> complete", () => {
    expect(
      deriveCheckinPhase(
        entry({ commitment: "outline the report", completionStatus: "complete", reflection: "it was easier than I thought" }),
      ),
    ).toBe("complete");
  });

  it("night resolved no -> incomplete", () => {
    expect(
      deriveCheckinPhase(
        entry({ commitment: "outline the report", completionStatus: "incomplete", blocker: "got pulled into a meeting" }),
      ),
    ).toBe("incomplete");
  });

  it("entry exists with only FR-010 acknowledgment fields set -> still no-entry", () => {
    // Found via live testing: submitAcknowledgment writes a DailyEntry before the
    // morning flow starts. From the morning check-in's perspective nothing has
    // been started yet, so this must not be misread as "morning-in-progress" —
    // doing so silently blocked Continue via canStartMorningCheckin below.
    expect(
      deriveCheckinPhase(
        entry({ acknowledgedMissedPrior: true, acknowledgmentResponse: "I forgot to check in" }),
      ),
    ).toBe("no-entry");
  });
});

describe("canStartMorningCheckin (Edge Cases: duplicate check-in guard)", () => {
  it("allows starting when there is no entry for today", () => {
    expect(canStartMorningCheckin(undefined)).toBe(true);
  });

  it("allows starting after an acknowledgment-only entry exists (FR-010 handoff)", () => {
    expect(
      canStartMorningCheckin(
        entry({ acknowledgedMissedPrior: true, acknowledgmentResponse: "I forgot to check in" }),
      ),
    ).toBe(true);
  });

  it("blocks a second morning check-in once one is already in progress", () => {
    expect(canStartMorningCheckin(entry({ avoidance: "the tax filing" }))).toBe(false);
  });

  it("blocks a second morning check-in once a commitment is already set", () => {
    expect(canStartMorningCheckin(entry({ commitment: "outline the report" }))).toBe(false);
  });

  it("blocks re-starting the morning check-in on an already-terminal day", () => {
    expect(
      canStartMorningCheckin(entry({ commitment: "x", completionStatus: "complete" })),
    ).toBe(false);
  });
});

describe("canStartNightCheckin / canSubmitNightOutcome (FR-014 gating)", () => {
  it("is unavailable when no entry exists for today", () => {
    expect(canStartNightCheckin(undefined)).toBe(false);
    expect(canSubmitNightOutcome(undefined)).toBe(false);
  });

  it("is unavailable while morning is still in progress (no commitment yet)", () => {
    const e = entry({ avoidance: "the tax filing" });
    expect(canStartNightCheckin(e)).toBe(false);
    expect(canSubmitNightOutcome(e)).toBe(false);
  });

  it("becomes available once a commitment is set", () => {
    const e = entry({ commitment: "outline the report" });
    expect(canStartNightCheckin(e)).toBe(true);
    expect(canSubmitNightOutcome(e)).toBe(true);
  });

  it("is unavailable again once the day is already terminal", () => {
    const complete = entry({ commitment: "x", completionStatus: "complete" });
    const incomplete = entry({ commitment: "x", completionStatus: "incomplete" });
    expect(canStartNightCheckin(complete)).toBe(false);
    expect(canStartNightCheckin(incomplete)).toBe(false);
  });
});
