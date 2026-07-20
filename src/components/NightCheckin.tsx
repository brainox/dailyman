import { useState } from "react";
import type { DailyEntry } from "../lib/types";

export interface NightCheckinProps {
  entry: DailyEntry | undefined;
  /** FR-014: night check-in is unavailable/redirected when no commitment exists for today. */
  canStart: boolean;
  onSubmitOutcome: (completed: boolean, detail: string) => void;
}

export function NightCheckin({ entry, canStart, onSubmitOutcome }: NightCheckinProps) {
  const [outcome, setOutcome] = useState<"yes" | "no" | null>(null);
  const [detailDraft, setDetailDraft] = useState("");

  if (!canStart) {
    return (
      <div className="max-w-md text-center text-muted">
        <p>Set today's commitment first before checking in tonight.</p>
      </div>
    );
  }

  if (outcome === null) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <p className="text-sm text-muted">Tonight's commitment:</p>
        <p className="text-text">{entry?.commitment}</p>
        <h1 className="text-xl font-semibold text-text">Did you do it?</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOutcome("yes")}
            className="rounded bg-complete px-4 py-2 font-medium text-bg"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setOutcome("no")}
            className="rounded bg-incomplete px-4 py-2 font-medium text-bg"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  const prompt = outcome === "yes" ? "What did you learn?" : "What blocked you?";

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-lg font-medium text-text">{prompt}</h1>
      <textarea
        value={detailDraft}
        onChange={(e) => setDetailDraft(e.target.value)}
        placeholder="Your answer..."
        className="min-h-24 rounded-md border border-border bg-surface p-3 text-text"
        aria-label={prompt}
      />
      <button
        type="button"
        disabled={!detailDraft.trim()}
        onClick={() => onSubmitOutcome(outcome === "yes", detailDraft.trim())}
        className="rounded bg-accent px-4 py-2 font-medium text-bg disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
