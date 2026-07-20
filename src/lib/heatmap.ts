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
    // Today's check-in may still be genuinely in progress (commitment set,
    // night check-in not due yet) — don't render it as a failure before the
    // day is actually over. A "pending" day is only ever a stale leftover
    // once it's in the past (see data-model.md's heatmap projection rule).
    if (entry.completionStatus === "pending" && date === today) {
      return { date, state: "no-entry" };
    }
    return { date, state: "incomplete" };
  });
}
