export type CompletionStatus = "pending" | "complete" | "incomplete";

/** One record per calendar day, keyed by ISO date string (YYYY-MM-DD). */
export interface DailyEntry {
  date: string;
  avoidance?: string;
  morningFollowup?: string;
  commitment?: string;
  morningCompletedAt?: string;
  completionStatus: CompletionStatus;
  reflection?: string;
  blocker?: string;
  nightCompletedAt?: string;
  acknowledgedMissedPrior?: boolean;
  acknowledgmentResponse?: string;
}

export type CheckinStep =
  | "morning-avoidance"
  | "morning-followup-wait"
  | "morning-commitment"
  | "acknowledgment"
  | "night-outcome"
  | "night-followup-wait"
  | "night-detail";

/** At most one active in-progress entry at a time; cleared on reaching a terminal state. */
export interface InProgressFlowState {
  activeDate: string;
  step: CheckinStep;
}

export interface Streak {
  currentLength: number;
  startDate: string | null;
}

export type HeatmapDayState = "complete" | "incomplete" | "no-entry";

export interface HeatmapDay {
  date: string;
  state: HeatmapDayState;
}
