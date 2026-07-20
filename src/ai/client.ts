import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "../storage/metaStore";

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 15_000;

/** Thrown when no API key is stored yet — callers should show the key-entry prompt, not a generic error. */
export class ApiKeyMissingError extends Error {
  constructor() {
    super("No Anthropic API key configured.");
    this.name = "ApiKeyMissingError";
  }
}

/** Normalized failure for any network error, timeout, API error, or malformed/empty response. */
export class AiGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiGenerationError";
  }
}

export interface GenerateTextOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Single entry point for both live-generation calls (contracts/ai-generation.md).
 * Checks for an API key before attempting the call so callers can distinguish
 * "needs a key" from "the call failed" per the contract's error-handling rules.
 */
export async function generateText({
  system,
  user,
  maxTokens = 300,
}: GenerateTextOptions): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new ApiKeyMissingError();
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      },
      { signal: controller.signal },
    );

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!text) {
      throw new AiGenerationError("The model returned an empty response.");
    }
    return text;
  } catch (error) {
    if (error instanceof AiGenerationError) {
      throw error;
    }
    throw new AiGenerationError(
      "Failed to generate a response. Check your connection and try again.",
      error,
    );
  } finally {
    clearTimeout(timeout);
  }
}
