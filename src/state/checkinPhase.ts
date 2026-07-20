import type { DailyEntry } from "../lib/types";

/**
 * Per-day phase derived purely from a DailyEntry, matching data-model.md's
 * state diagram: (no entry) -> morning-in-progress -> commitment-set ->
 * complete | incomplete. "night-in-progress" is a transient UI step layered
 * on top of "commitment-set" (tracked via InProgressFlowState), not a
 * distinct DailyEntry state.
 */
export type CheckinPhase =
  | "no-entry"
  | "morning-in-progress"
  | "commitment-set"
  | "complete"
  | "incomplete";

export function deriveCheckinPhase(entry: DailyEntry | undefined): CheckinPhase {
  if (!entry) return "no-entry";
  if (entry.completionStatus === "complete") return "complete";
  if (entry.completionStatus === "incomplete") return "incomplete";
  if (entry.commitment) return "commitment-set";
  if (entry.avoidance) return "morning-in-progress";
  // A DailyEntry can exist for today with only FR-010 acknowledgment fields
  // set (submitAcknowledgment writes acknowledgedMissedPrior/acknowledgmentResponse
  // before the morning flow itself has started). From the morning check-in's
  // perspective nothing has been started yet, so this must still read as
  // "no-entry" — otherwise canStartMorningCheckin() below incorrectly blocks
  // the very next step (found via live testing: Continue silently did nothing).
  return "no-entry";
}

/** FR-014: the night check-in is unavailable until today's commitment exists. */
export function canStartNightCheckin(entry: DailyEntry | undefined): boolean {
  return deriveCheckinPhase(entry) === "commitment-set";
}

/**
 * Edge Cases: guards against starting a second morning check-in once one is
 * already recorded (or in progress) for today.
 */
export function canStartMorningCheckin(entry: DailyEntry | undefined): boolean {
  return deriveCheckinPhase(entry) === "no-entry";
}

/** Guards against re-running the night check-in once today's entry is already terminal. */
export function canSubmitNightOutcome(entry: DailyEntry | undefined): boolean {
  return deriveCheckinPhase(entry) === "commitment-set";
}
