import type { HeatmapDay, Streak } from "../lib/types";
import { StreakCounter } from "./StreakCounter";
import { Heatmap } from "./Heatmap";

export interface MainScreenProps {
  streak: Streak;
  heatmapDays: HeatmapDay[];
  todayStatusLabel: string;
  canEnterCheckin: boolean;
  onEnterCheckin: () => void;
}

/** SC-003: streak + 30-day history visible on one screen, no navigation required. */
export function MainScreen({
  streak,
  heatmapDays,
  todayStatusLabel,
  canEnterCheckin,
  onEnterCheckin,
}: MainScreenProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <StreakCounter streak={streak} />
      <Heatmap days={heatmapDays} />
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted">{todayStatusLabel}</p>
        {canEnterCheckin && (
          <button
            type="button"
            onClick={onEnterCheckin}
            className="rounded bg-accent px-4 py-2 font-medium text-bg"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
