import type { HeatmapDay } from "../lib/types";

export interface HeatmapProps {
  days: HeatmapDay[];
}

const STATE_CLASSES: Record<HeatmapDay["state"], string> = {
  complete: "bg-complete",
  incomplete: "bg-incomplete",
  "no-entry": "border border-border bg-surface",
};

/** FR-009: three visually distinct states across the last 30 days. */
export function Heatmap({ days }: HeatmapProps) {
  return (
    <div role="img" aria-label="Last 30 days" className="grid grid-cols-10 gap-1.5">
      {days.map((day) => (
        <div
          key={day.date}
          title={`${day.date}: ${day.state}`}
          className={`h-4 w-4 rounded-sm ${STATE_CLASSES[day.state]}`}
        />
      ))}
    </div>
  );
}
