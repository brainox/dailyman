import type { Streak } from "../lib/types";

export interface StreakCounterProps {
  streak: Streak;
}

/** The dominant visual element of the main screen (spec Assumptions). */
export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-7xl font-bold tabular-nums text-accent"
        aria-label={`Current streak: ${streak.currentLength} days`}
      >
        {streak.currentLength}
      </span>
      <span className="text-sm uppercase tracking-wide text-muted">day streak</span>
    </div>
  );
}
