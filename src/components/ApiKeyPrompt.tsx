import { useState } from "react";

export interface ApiKeyPromptProps {
  onSave: (apiKey: string) => void;
  saving?: boolean;
}

/**
 * contracts/ai-generation.md "API key": shown before any generation call is
 * attempted when no key is stored yet, rather than failing the call.
 */
export function ApiKeyPrompt({ onSave, saving = false }: ApiKeyPromptProps) {
  const [key, setKey] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Add your Anthropic API key</h1>
      <p className="text-sm text-muted">
        Dailyman calls the Anthropic API directly from your browser to generate
        today's follow-up questions. Your key is stored locally on this device
        only — never sent anywhere else.
      </p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-ant-..."
        className="rounded-md border border-border bg-surface p-3 text-text"
        aria-label="Anthropic API key"
      />
      <button
        type="button"
        disabled={!key.trim() || saving}
        onClick={() => onSave(key.trim())}
        className="rounded bg-accent px-4 py-2 font-medium text-bg disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save key"}
      </button>
    </div>
  );
}
