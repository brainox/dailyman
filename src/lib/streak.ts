import type { DailyEntry, Streak } from "./types";
import { yesterdayOf } from "./date";

/**
 * Walks backward day-by-day from the most recent resolved day, per
 * data-model.md's Streak computation rule. Computed on every read rather than
 * stored, so a multi-day gap self-corrects without needing a reset event.
 */
export function computeStreak(entries: DailyEntry[], today: string): Streak {
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const todayEntry = byDate.get(today);
  const startCursor =
    todayEntry && todayEntry.completionStatus !== "pending" ? today : yesterdayOf(today);

  let currentLength = 0;
  let startDate: string | null = null;
  let cursor = startCursor;

  // FR-013: a single incomplete or missing day (of either kind) hard-resets the streak — no grace.
  for (;;) {
    const entry = byDate.get(cursor);
    if (!entry || entry.completionStatus !== "complete") {
      break;
    }
    currentLength += 1;
    startDate = cursor;
    cursor = yesterdayOf(cursor);
  }

  return { currentLength, startDate };
}
