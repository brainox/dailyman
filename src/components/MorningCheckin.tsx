import { useState } from "react";
import type { DailyEntry } from "../lib/types";
import { AiErrorState } from "./AiErrorState";

export interface MorningCheckinProps {
  entry: DailyEntry | undefined;
  generating: boolean;
  error: string | undefined;
  isApiKeyMissing: boolean;
  pendingAvoidance: string | undefined;
  onSubmitAvoidance: (avoidance: string) => void;
  onRetry: () => void;
  onSubmitCommitment: (commitment: string) => void;
}

/** FR-001-FR-003: avoidance -> one live follow-up question -> commitment. */
export function MorningCheckin({
  entry,
  generating,
  error,
  isApiKeyMissing,
  pendingAvoidance,
  onSubmitAvoidance,
  onRetry,
  onSubmitCommitment,
}: MorningCheckinProps) {
  const [avoidanceDraft, setAvoidanceDraft] = useState("");
  const [commitmentDraft, setCommitmentDraft] = useState("");

  const hasFollowup = Boolean(entry?.morningFollowup) && !entry?.commitment;

  if (hasFollowup && entry) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <p className="text-sm text-muted">You said you're avoiding:</p>
        <p className="text-text">{entry.avoidance}</p>
        <p className="text-lg font-medium text-text">{entry.morningFollowup}</p>
        <textarea
          value={commitmentDraft}
          onChange={(e) => setCommitmentDraft(e.target.value)}
          placeholder="Your answer..."
          className="min-h-24 rounded-md border border-border bg-surface p-3 text-text"
          aria-label="Answer to the follow-up question"
        />
        <button
          type="button"
          disabled={!commitmentDraft.trim()}
          onClick={() => onSubmitCommitment(commitmentDraft.trim())}
          className="rounded bg-accent px-4 py-2 font-medium text-bg disabled:opacity-50"
        >
          Set today's commitment
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">
        What are you avoiding today?
      </h1>
      <textarea
        value={pendingAvoidance ?? avoidanceDraft}
        onChange={(e) => setAvoidanceDraft(e.target.value)}
        disabled={generating}
        placeholder="Say it plainly..."
        className="min-h-24 rounded-md border border-border bg-surface p-3 text-text disabled:opacity-60"
        aria-label="What are you avoiding today?"
      />
      {isApiKeyMissing && (
        <p className="text-sm text-incomplete">
          Add an Anthropic API key in settings before starting a check-in.
        </p>
      )}
      {error && <AiErrorState message={error} onRetry={onRetry} retrying={generating} />}
      {!error && !isApiKeyMissing && (
        <button
          type="button"
          disabled={generating || !(pendingAvoidance ?? avoidanceDraft).trim()}
          onClick={() => onSubmitAvoidance((pendingAvoidance ?? avoidanceDraft).trim())}
          className="rounded bg-accent px-4 py-2 font-medium text-bg disabled:opacity-50"
        >
          {generating ? "Thinking…" : "Continue"}
        </button>
      )}
    </div>
  );
}
