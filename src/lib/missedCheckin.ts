import type { DailyEntry } from "./types";

export interface MissedCheckin {
  date: string;
  commitment: string;
}

/**
 * FR-010: detects whether yesterday had a commitment but was never resolved
 * (no night check-in). `acknowledgedMissedPrior` is set on TODAY's entry once
 * answered (data-model.md), so a re-check after acknowledging returns null.
 */
export function detectMissedCheckin(
  yesterdayEntry: DailyEntry | undefined,
  todayEntry: DailyEntry | undefined,
): MissedCheckin | null {
  if (!yesterdayEntry || !yesterdayEntry.commitment) return null;
  if (yesterdayEntry.completionStatus !== "pending") return null;
  if (todayEntry?.acknowledgedMissedPrior) return null;
  return { date: yesterdayEntry.date, commitment: yesterdayEntry.commitment };
}
