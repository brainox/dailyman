import { useState } from "react";
import { AiErrorState } from "./AiErrorState";

export interface AcknowledgmentStepProps {
  missedCommitment: string;
  prompt: string | undefined;
  generating: boolean;
  error: string | undefined;
  onRetry: () => void;
  onSubmit: (response: string) => void;
}

/** FR-010: shown before the new day's commitment prompt when last night's check-in was missed. */
export function AcknowledgmentStep({
  missedCommitment,
  prompt,
  generating,
  error,
  onRetry,
  onSubmit,
}: AcknowledgmentStepProps) {
  const [responseDraft, setResponseDraft] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <p className="text-sm text-muted">Last night's commitment:</p>
      <p className="text-text">{missedCommitment}</p>

      {generating && !prompt && <p className="text-muted">Thinking…</p>}
      {error && <AiErrorState message={error} onRetry={onRetry} retrying={generating} />}

      {prompt && !error && (
        <>
          <p className="text-lg font-medium text-text">{prompt}</p>
          <textarea
            value={responseDraft}
            onChange={(e) => setResponseDraft(e.target.value)}
            placeholder="Your answer..."
            className="min-h-24 rounded-md border border-border bg-surface p-3 text-text"
            aria-label={prompt}
          />
          <button
            type="button"
            disabled={!responseDraft.trim()}
            onClick={() => onSubmit(responseDraft.trim())}
            className="rounded bg-accent px-4 py-2 font-medium text-bg disabled:opacity-50"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
