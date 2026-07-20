interface AiErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

/**
 * Inline, retry-capable error state per contracts/ai-generation.md "Error handling" —
 * never a full-screen blocker, since only the two AI calls are network-dependent.
 */
export function AiErrorState({ message, onRetry, retrying = false }: AiErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-incomplete/40 bg-incomplete/10 p-4 text-sm text-text"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-3 rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
