import type { DailyEntry, HeatmapDay } from "./types";
import { lastNDays } from "./date";

/** Read-only view model derived from DailyEntry — not a separate stored entity (FR-009). */
export function computeHeatmap(
  entries: DailyEntry[],
  today: string,
  days = 30,
): HeatmapDay[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  return lastNDays(days, today).map((date) => {
    const entry = byDate.get(date);
    if (!entry) return { date, state: "no-entry" };
    if (entry.completionStatus === "complete") return { date, state: "complete" };
    // Covers "incomplete" and an abandoned "pending" left over from a past day.
    return { date, state: "incomplete" };
  });
}
