import { describe, it, expect } from "vitest";
import { computeHeatmap } from "../../src/lib/heatmap";
import type { DailyEntry } from "../../src/lib/types";

const TODAY = "2026-07-20";

function entry(date: string, completionStatus: DailyEntry["completionStatus"]): DailyEntry {
  return { date, completionStatus };
}

describe("computeHeatmap (data-model.md heatmap projection, FR-009)", () => {
  it("returns 30 days ending today, oldest first", () => {
    const result = computeHeatmap([], TODAY);
    expect(result).toHaveLength(30);
    expect(result[0].date).toBe("2026-06-21");
    expect(result[29].date).toBe(TODAY);
  });

  it("marks a day with no entry as no-entry", () => {
    const result = computeHeatmap([], TODAY);
    expect(result.every((d) => d.state === "no-entry")).toBe(true);
  });

  it("marks a complete day as complete", () => {
    const result = computeHeatmap([entry(TODAY, "complete")], TODAY);
    expect(result[29]).toEqual({ date: TODAY, state: "complete" });
  });

  it("marks an incomplete day as incomplete", () => {
    const result = computeHeatmap([entry(TODAY, "incomplete")], TODAY);
    expect(result[29]).toEqual({ date: TODAY, state: "incomplete" });
  });

  it("marks an abandoned pending day (past, unresolved) as incomplete", () => {
    const yesterday = "2026-07-19";
    const result = computeHeatmap([entry(yesterday, "pending")], TODAY);
    const day = result.find((d) => d.date === yesterday);
    expect(day).toEqual({ date: yesterday, state: "incomplete" });
  });

  it("produces all three distinct states together", () => {
    const result = computeHeatmap(
      [entry("2026-07-18", "complete"), entry("2026-07-19", "incomplete")],
      TODAY,
    );
    const states = new Set(result.map((d) => d.state));
    expect(states).toEqual(new Set(["complete", "incomplete", "no-entry"]));
  });
});
